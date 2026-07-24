from email.utils import parsedate_to_datetime
from typing import Optional

from schemas import AnalyzedEmail


def _parse_dt(date_str: str):
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        return None


def upsert(conn, email: AnalyzedEmail, user_id: str, record_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO email_state
                (email_id, user_id, sender, subject, received_date, body, body_html,
                 source_file, category, tab, extracted_deadline)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email_id) DO NOTHING
            """,
            (
                record_id,
                user_id,
                email.sender,
                email.subject,
                _parse_dt(email.received_date),
                email.body,
                email.body_html,
                email.source_file,
                email.category,
                email.tab,
                email.extracted_deadline,
            ),
        )


def update_content(
    conn,
    email_id: str,
    user_id: str,
    body: str,
    body_html: Optional[str],
) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state
            SET body = %s, body_html = %s
            WHERE email_id = %s AND user_id = %s
            RETURNING email_id
            """,
            (body, body_html, email_id, user_id),
        )
        return cur.fetchone() is not None


def find_by_id(conn, email_id: str, user_id: str) -> Optional[AnalyzedEmail]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM email_state WHERE email_id = %s AND user_id = %s",
            (email_id, user_id),
        )
        cols = [d[0] for d in cur.description]
        row = cur.fetchone()
        return _to_model(dict(zip(cols, row))) if row else None


def count_all(conn, tab: Optional[str], user_id: str) -> int:
    with conn.cursor() as cur:
        if tab:
            cur.execute(
                "SELECT COUNT(*) FROM email_state WHERE tab = %s AND user_id = %s",
                (tab, user_id),
            )
        else:
            cur.execute(
                "SELECT COUNT(*) FROM email_state WHERE user_id = %s AND tab != 'BIN'",
                (user_id,),
            )
        return cur.fetchone()[0]


def get_all(conn, tab: Optional[str], user_id: str, limit: int = 20, offset: int = 0) -> list[AnalyzedEmail]:
    with conn.cursor() as cur:
        if tab:
            cur.execute(
                """
                SELECT * FROM email_state
                WHERE tab = %s AND user_id = %s
                ORDER BY processed_at DESC
                LIMIT %s OFFSET %s
                """,
                (tab, user_id, limit, offset),
            )
        else:
            cur.execute(
                """
                SELECT * FROM email_state
                WHERE user_id = %s AND tab != 'BIN'
                ORDER BY processed_at DESC
                LIMIT %s OFFSET %s
                """,
                (user_id, limit, offset),
            )
        cols = [d[0] for d in cur.description]
        return [_to_model(dict(zip(cols, row))) for row in cur.fetchall()]


def search(conn, query: str, user_id: str) -> list[AnalyzedEmail]:
    pattern = f"%{query}%"
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM email_state
            WHERE user_id = %s AND tab != 'BIN'
              AND (sender ILIKE %s OR subject ILIKE %s OR body ILIKE %s)
            ORDER BY processed_at DESC
            LIMIT 50
            """,
            (user_id, pattern, pattern, pattern),
        )
        cols = [d[0] for d in cur.description]
        return [_to_model(dict(zip(cols, row))) for row in cur.fetchall()]


def set_tab(conn, email_id: str, new_tab: str, user_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state
            SET tab = %s,
                extracted_deadline = CASE WHEN %s = 'NO_DEADLINE' THEN NULL ELSE extracted_deadline END
            WHERE email_id = %s AND user_id = %s AND tab != 'BIN'
            RETURNING email_id
            """,
            (new_tab, new_tab, email_id, user_id),
        )
        return cur.fetchone() is not None


def delete_email(conn, email_id: str, user_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state
            SET pre_delete_tab = tab, tab = 'BIN'
            WHERE email_id = %s AND user_id = %s AND tab != 'BIN'
            RETURNING email_id
            """,
            (email_id, user_id),
        )
        return cur.fetchone() is not None


def set_deadline(conn, email_id: str, new_deadline: Optional[str], user_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state
            SET extracted_deadline = %s,
                tab = CASE
                  WHEN tab IN ('MISSED', 'NO_DEADLINE', 'NEEDS_REVIEW') AND %s IS NOT NULL THEN
                    CASE WHEN %s::timestamptz > NOW() THEN 'FILTERED' ELSE 'MISSED' END
                  ELSE tab
                END
            WHERE email_id = %s AND user_id = %s AND tab != 'BIN'
            RETURNING email_id
            """,
            (new_deadline, new_deadline, new_deadline, email_id, user_id),
        )
        return cur.fetchone() is not None


def recover_email(conn, email_id: str, user_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state
            SET tab = COALESCE(pre_delete_tab, 'NEEDS_REVIEW'), pre_delete_tab = NULL
            WHERE email_id = %s AND user_id = %s AND tab = 'BIN'
            RETURNING email_id
            """,
            (email_id, user_id),
        )
        return cur.fetchone() is not None


def confirm(conn, email_id: str, user_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state SET tab = 'FILTERED'
            WHERE email_id = %s AND user_id = %s AND tab = 'NEEDS_REVIEW'
            RETURNING email_id
            """,
            (email_id, user_id),
        )
        return cur.fetchone() is not None


def dismiss(conn, email_id: str, user_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state SET tab = 'NO_DEADLINE'
            WHERE email_id = %s AND user_id = %s AND tab = 'NEEDS_REVIEW'
            RETURNING email_id
            """,
            (email_id, user_id),
        )
        return cur.fetchone() is not None


def mark_missed(conn, user_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state
            SET tab = 'MISSED'
            WHERE user_id = %s
              AND tab = 'FILTERED'
              AND extracted_deadline IS NOT NULL
              AND extracted_deadline < NOW()
            """,
            (user_id,),
        )


def mark_done(conn, email_id: str, user_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_state SET tab = 'DONE'
            WHERE email_id = %s AND user_id = %s AND tab != 'DONE'
            RETURNING email_id
            """,
            (email_id, user_id),
        )
        return cur.fetchone() is not None


def _to_model(row: dict) -> AnalyzedEmail:
    return AnalyzedEmail(
        email_id=row["email_id"],
        sender=row["sender"],
        subject=row["subject"],
        received_date=str(row["received_date"] or ""),
        body=row["body"],
        body_html=row.get("body_html"),
        source_file=row["source_file"],
        category=row["category"],
        tab=row["tab"],
        extracted_deadline=str(row["extracted_deadline"]) if row["extracted_deadline"] else None,
    )
