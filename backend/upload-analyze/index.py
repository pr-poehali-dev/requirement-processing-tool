"""Загрузка файла в S3 и запуск анализа: сравнение с базой требований."""
import json
import os
import base64
import uuid
import psycopg2
import boto3


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def simple_match(text_a: str, text_b: str) -> int:
    """Простое лексическое сравнение — процент общих слов."""
    a_words = set(w.lower().strip(".,;:!?()") for w in text_a.split() if len(w) > 3)
    b_words = set(w.lower().strip(".,;:!?()") for w in text_b.split() if len(w) > 3)
    if not a_words or not b_words:
        return 0
    intersection = a_words & b_words
    union = a_words | b_words
    jaccard = len(intersection) / len(union)
    return int(round(jaccard * 100))


def classify_status(match_percent: int) -> str:
    if match_percent >= 90:
        return "match"
    elif match_percent >= 50:
        return "partial"
    elif match_percent >= 20:
        return "partial"
    return "new"


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
    file_name = body.get("file_name", "document.bin")
    file_data_b64 = body.get("file_data", "")
    requirements_text = body.get("requirements", [])

    conn = get_conn()
    cur = conn.cursor()

    # Загружаем файл в S3
    file_key = None
    if file_data_b64:
        file_bytes = base64.b64decode(file_data_b64)
        file_key = f"uploads/{uuid.uuid4()}/{file_name}"
        s3 = get_s3()
        s3.put_object(
            Bucket="files",
            Key=file_key,
            Body=file_bytes,
            ContentType="application/octet-stream",
        )

    # Создаём сессию анализа
    cur.execute("""
        INSERT INTO analysis_sessions (file_name, file_key, status)
        VALUES (%s, %s, 'processing')
        RETURNING id
    """, (file_name, file_key))
    session_id = cur.fetchone()[0]
    conn.commit()

    # Загружаем накопленную базу для сравнения
    cur.execute("SELECT id, requirement, requirement_group, product FROM requirements_db")
    db_reqs = cur.fetchall()

    # Анализируем каждое переданное требование
    results = []
    counts = {"match": 0, "partial": 0, "new": 0, "conflict": 0}

    for i, req_text in enumerate(requirements_text):
        if not req_text.strip():
            continue

        best_match_id = None
        best_match_pct = 0
        best_component = ""

        for db_id, db_text, db_group, db_product in db_reqs:
            pct = simple_match(req_text, db_text)
            if pct > best_match_pct:
                best_match_pct = pct
                best_match_id = db_id
                best_component = db_group or db_product

        # Проверяем конфликт: совпадение среднее (40-75%) — потенциальный конфликт
        if 40 <= best_match_pct <= 75:
            status = "conflict" if best_match_pct < 60 else "partial"
        else:
            status = classify_status(best_match_pct)

        counts[status] = counts.get(status, 0) + 1

        code = f"REQ-{str(i+1).zfill(3)}"
        cur.execute("""
            INSERT INTO analysis_results
              (session_id, code, requirement_text, component, source_file, status, match_percent, matched_db_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            session_id, code, req_text.strip(),
            best_component, file_name,
            status, best_match_pct,
            best_match_id if best_match_pct > 0 else None,
        ))
        result_id = cur.fetchone()[0]
        results.append({
            "id": str(result_id),
            "code": code,
            "text": req_text.strip(),
            "component": best_component,
            "source": file_name,
            "status": status,
            "matchPercent": best_match_pct,
            "matchedWith": str(best_match_id) if best_match_id else None,
        })

    # Обновляем статистику сессии
    cur.execute("""
        UPDATE analysis_sessions SET
          status='completed', completed_at=NOW(),
          total_count=%s, match_count=%s, partial_count=%s,
          new_count=%s, conflict_count=%s
        WHERE id=%s
    """, (
        len(results),
        counts.get("match", 0),
        counts.get("partial", 0),
        counts.get("new", 0),
        counts.get("conflict", 0),
        session_id,
    ))
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "session_id": session_id,
            "results": results,
            "stats": counts,
        }, ensure_ascii=False)
    }
