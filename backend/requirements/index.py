"""CRUD для накопленной базы требований по продуктам и группам."""
import json
import os
import psycopg2


def get_conn():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    dsn = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(dsn, options=f"-c search_path={schema}")
    return conn


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    qs = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET /requirements — список
        if method == "GET":
            product = qs.get("product", "")
            group = qs.get("group", "")
            search = qs.get("search", "")
            limit = int(qs.get("limit", 100))
            offset = int(qs.get("offset", 0))

            conditions = []
            if product:
                conditions.append(f"product = '{product.replace(chr(39), chr(39)*2)}'")
            if group:
                conditions.append(f"requirement_group = '{group.replace(chr(39), chr(39)*2)}'")
            if search:
                s = search.replace("'", "''")
                conditions.append(f"(requirement ILIKE '%{s}%' OR synonyms ILIKE '%{s}%' OR external_id ILIKE '%{s}%')")

            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

            cur.execute(f"""
                SELECT id, product, requirement_group, requirement, synonyms,
                       presence, check_date, risk_comment, moi_office, r7_office,
                       is_new, proposed_wording, source, external_id,
                       author, updated_at, created_by, created_at, jira_link
                FROM requirements_db
                {where}
                ORDER BY product, requirement_group, id
                LIMIT {limit} OFFSET {offset}
            """)
            cols = [d[0] for d in cur.description]
            rows = []
            for row in cur.fetchall():
                r = dict(zip(cols, row))
                if r.get("check_date"):
                    r["check_date"] = str(r["check_date"])
                if r.get("updated_at"):
                    r["updated_at"] = str(r["updated_at"])
                if r.get("created_at"):
                    r["created_at"] = str(r["created_at"])
                rows.append(r)

            # Уникальные продукты и группы для фильтров
            cur.execute("SELECT DISTINCT product FROM requirements_db WHERE product != '' ORDER BY product")
            products = [r[0] for r in cur.fetchall()]
            cur.execute("SELECT DISTINCT requirement_group FROM requirements_db WHERE requirement_group != '' ORDER BY requirement_group")
            groups = [r[0] for r in cur.fetchall()]

            cur.execute(f"SELECT COUNT(*) FROM requirements_db {where}")
            total = cur.fetchone()[0]

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "items": rows,
                    "total": total,
                    "products": products,
                    "groups": groups,
                }, ensure_ascii=False)
            }

        # POST /requirements — создать
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            cur.execute("""
                INSERT INTO requirements_db
                  (product, requirement_group, requirement, synonyms, presence,
                   check_date, risk_comment, moi_office, r7_office, is_new,
                   proposed_wording, source, external_id, author, created_by, jira_link)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id
            """, (
                body.get("product", ""),
                body.get("requirement_group", ""),
                body.get("requirement", ""),
                body.get("synonyms", ""),
                body.get("presence", ""),
                body.get("check_date") or None,
                body.get("risk_comment", ""),
                body.get("moi_office", ""),
                body.get("r7_office", ""),
                body.get("is_new", False),
                body.get("proposed_wording", ""),
                body.get("source", ""),
                body.get("external_id", ""),
                body.get("author", ""),
                body.get("created_by", ""),
                body.get("jira_link", ""),
            ))
            new_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"id": new_id})}

        # PUT /requirements — обновить
        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            req_id = body.get("id")
            cur.execute("""
                UPDATE requirements_db SET
                  product=%s, requirement_group=%s, requirement=%s, synonyms=%s,
                  presence=%s, check_date=%s, risk_comment=%s, moi_office=%s,
                  r7_office=%s, is_new=%s, proposed_wording=%s, source=%s,
                  external_id=%s, author=%s, jira_link=%s, updated_at=NOW()
                WHERE id=%s
            """, (
                body.get("product", ""),
                body.get("requirement_group", ""),
                body.get("requirement", ""),
                body.get("synonyms", ""),
                body.get("presence", ""),
                body.get("check_date") or None,
                body.get("risk_comment", ""),
                body.get("moi_office", ""),
                body.get("r7_office", ""),
                body.get("is_new", False),
                body.get("proposed_wording", ""),
                body.get("source", ""),
                body.get("external_id", ""),
                body.get("author", ""),
                body.get("jira_link", ""),
                req_id,
            ))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # PATCH /requirements — частичное обновление (комментарий/статус)
        if method == "PATCH":
            body = json.loads(event.get("body") or "{}")
            req_id = body.get("id")
            fields = []
            values = []
            allowed = ["analyst_comment", "presence", "risk_comment", "proposed_wording"]
            for f in allowed:
                if f in body:
                    fields.append(f"{f}=%s")
                    values.append(body[f])
            if fields:
                values.append(req_id)
                cur.execute(f"UPDATE requirements_db SET {', '.join(fields)}, updated_at=NOW() WHERE id=%s", values)
                conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}