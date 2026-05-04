"""Импорт базы требований из XLSX или CSV файла."""
import json
import os
import base64
import io
import csv
import psycopg2
import openpyxl


def get_conn():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={schema}")
    return conn


# Маппинг заголовков из реальной таблицы на поля БД
COLUMN_MAP = {
    "продукт": "product",
    "product": "product",
    "группа требований": "requirement_group",
    "requirement_group": "requirement_group",
    "требование": "requirement",
    "requirement": "requirement",
    "синонимы": "synonyms",
    "synonyms": "synonyms",
    "наличие": "presence",
    "presence": "presence",
    "дата проверки требования": "check_date",
    "дата проверки": "check_date",
    "check_date": "check_date",
    "комментарий-риск": "risk_comment",
    "комментарий риск": "risk_comment",
    "комментарий": "risk_comment",
    "risk_comment": "risk_comment",
    "мой офис": "moi_office",
    "moi_office": "moi_office",
    "р7 офис": "r7_office",
    "р7офис": "r7_office",
    "r7_office": "r7_office",
    "новое": "is_new",
    "is_new": "is_new",
    "предлагаемая формулировка": "proposed_wording",
    "proposed_wording": "proposed_wording",
    "источник требования": "source",
    "источник": "source",
    "source": "source",
    "ид": "external_id",
    "id": "external_id",
    "external_id": "external_id",
    "автор изменений": "author",
    "автор": "author",
    "author": "author",
    "ссылка на jira": "jira_link",
    "jira": "jira_link",
    "jira_link": "jira_link",
}

DB_FIELDS = [
    "product", "requirement_group", "requirement", "synonyms", "presence",
    "check_date", "risk_comment", "moi_office", "r7_office", "is_new",
    "proposed_wording", "source", "external_id", "author", "jira_link",
]


def normalize_header(h: str) -> str:
    return h.strip().lower().replace("\xa0", " ")


def parse_xlsx(data: bytes) -> tuple[list[str], list[list]]:
    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return [], []
    headers = [str(c).strip() if c is not None else "" for c in rows[0]]
    data_rows = []
    for row in rows[1:]:
        if any(c is not None and str(c).strip() for c in row):
            data_rows.append([str(c).strip() if c is not None else "" for c in row])
    return headers, data_rows


def parse_csv(data: bytes) -> tuple[list[str], list[list]]:
    text = data.decode("utf-8-sig", errors="replace")
    reader = csv.reader(io.StringIO(text), delimiter="\t")
    rows = list(reader)
    if not rows:
        return [], []
    headers = [c.strip() for c in rows[0]]
    data_rows = [[c.strip() for c in row] for row in rows[1:] if any(c.strip() for c in row)]
    return headers, data_rows


def map_row(headers: list[str], row: list) -> dict:
    result = {f: "" for f in DB_FIELDS}
    result["is_new"] = False
    for i, h in enumerate(headers):
        key = COLUMN_MAP.get(normalize_header(h))
        if key and i < len(row):
            val = row[i]
            if key == "is_new":
                result[key] = bool(val and str(val).strip().lower() not in ("", "нет", "no", "false", "0"))
            elif key == "check_date":
                result[key] = val if val else None
            else:
                result[key] = str(val) if val else ""
    return result


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    file_name = body.get("file_name", "import.xlsx")
    file_data_b64 = body.get("file_data", "")
    mode = body.get("mode", "append")  # append | replace

    if not file_data_b64:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "file_data required"})}

    file_bytes = base64.b64decode(file_data_b64)
    ext = file_name.lower().split(".")[-1]

    if ext in ("xlsx", "xls", "ods"):
        col_headers, rows = parse_xlsx(file_bytes)
    else:
        col_headers, rows = parse_csv(file_bytes)

    if not rows:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Файл пуст или не удалось распознать"})}

    records = [map_row(col_headers, row) for row in rows]
    valid = [r for r in records if r.get("requirement", "").strip()]

    conn = get_conn()
    cur = conn.cursor()

    if mode == "replace":
        cur.execute("DELETE FROM requirements_db WHERE TRUE")

    inserted = 0
    for rec in valid:
        cur.execute("""
            INSERT INTO requirements_db
              (product, requirement_group, requirement, synonyms, presence,
               check_date, risk_comment, moi_office, r7_office, is_new,
               proposed_wording, source, external_id, author, jira_link)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            rec["product"], rec["requirement_group"], rec["requirement"],
            rec["synonyms"], rec["presence"],
            rec["check_date"] if rec["check_date"] else None,
            rec["risk_comment"], rec["moi_office"], rec["r7_office"],
            rec["is_new"], rec["proposed_wording"], rec["source"],
            rec["external_id"], rec["author"], rec["jira_link"],
        ))
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "imported": inserted,
            "skipped": len(records) - inserted,
            "total_rows": len(rows),
            "mode": mode,
        }, ensure_ascii=False)
    }