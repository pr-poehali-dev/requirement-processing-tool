"""Получение результатов анализа по сессии, обновление статуса вручную."""
import json
import os
import psycopg2


def get_conn():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={schema}")
    return conn


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            session_id = qs.get("session_id")

            # Список сессий
            if not session_id:
                cur.execute("""
                    SELECT id, file_name, status, created_at, completed_at,
                           total_count, match_count, partial_count, new_count, conflict_count
                    FROM analysis_sessions
                    ORDER BY created_at DESC
                    LIMIT 50
                """)
                cols = [d[0] for d in cur.description]
                sessions = []
                for row in cur.fetchall():
                    s = dict(zip(cols, row))
                    s["created_at"] = str(s["created_at"])
                    if s["completed_at"]:
                        s["completed_at"] = str(s["completed_at"])
                    sessions.append(s)
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"sessions": sessions}, ensure_ascii=False)}

            # Результаты конкретной сессии
            cur.execute("""
                SELECT ar.id, ar.code, ar.requirement_text, ar.component,
                       ar.source_file, ar.status, ar.match_percent,
                       ar.matched_db_id, ar.analyst_comment, ar.manual_checked,
                       rd.requirement as matched_text, rd.requirement_group as matched_group
                FROM analysis_results ar
                LEFT JOIN requirements_db rd ON rd.id = ar.matched_db_id
                WHERE ar.session_id = %s
                ORDER BY ar.id
            """, (session_id,))
            cols = [d[0] for d in cur.description]
            results = []
            for row in cur.fetchall():
                r = dict(zip(cols, row))
                results.append(r)

            cur.execute("SELECT * FROM analysis_sessions WHERE id=%s", (session_id,))
            scols = [d[0] for d in cur.description]
            srow = cur.fetchone()
            session = dict(zip(scols, srow)) if srow else {}
            if session.get("created_at"):
                session["created_at"] = str(session["created_at"])
            if session.get("completed_at"):
                session["completed_at"] = str(session["completed_at"])

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"session": session, "results": results}, ensure_ascii=False)
            }

        if method == "PATCH":
            body = json.loads(event.get("body") or "{}")
            result_id = body.get("id")
            fields = []
            values = []
            for f in ["status", "analyst_comment", "manual_checked"]:
                if f in body:
                    fields.append(f"{f}=%s")
                    values.append(body[f])
            if fields and result_id:
                values.append(result_id)
                cur.execute(f"UPDATE analysis_results SET {', '.join(fields)} WHERE id=%s", values)
                conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}