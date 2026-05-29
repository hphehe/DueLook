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
                (email_id, user_id, sender, subject, received_date, body,
                 source_file, category, tab, extracted_deadline)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email_id) DO NOTHING
            """,
            (
                record_id,
                user_id,
                email.sender,
                email.subject,
                _parse_dt(email.received_date),
                email.body,
                email.source_file,
                email.category,
                email.tab,
                email.extracted_deadline,
            ),
        )


def find_by_id(conn, email_id: str, user_id: str) -> Optional[AnalyzedEmail]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM email_state WHERE email_id = %s AND user_id = %s",
            (email_id, user_id),
        )
        cols = [d[0] for d in cur.description]
        row = cur.fetchone()
        return _to_model(dict(zip(cols, row))) if row else None


def get_all(conn, tab: Optional[str], user_id: str) -> list[AnalyzedEmail]:
    with conn.cursor() as cur:
        if tab:
            cur.execute(
                """
                SELECT * FROM email_state
                WHERE tab = %s AND user_id = %s
                ORDER BY processed_at DESC
                """,
                (tab, user_id),
            )
        else:
            cur.execute(
                """
                SELECT * FROM email_state
                WHERE user_id = %s
                ORDER BY processed_at DESC
                """,
                (user_id,),
            )
        cols = [d[0] for d in cur.description]
        return [_to_model(dict(zip(cols, row))) for row in cur.fetchall()]


def _to_model(row: dict) -> AnalyzedEmail:
    return AnalyzedEmail(
        email_id=row["email_id"],
        sender=row["sender"],
        subject=row["subject"],
        received_date=str(row["received_date"] or ""),
        body=row["body"],
        source_file=row["source_file"],
        category=row["category"],
        tab=row["tab"],
        extracted_deadline=str(row["extracted_deadline"]) if row["extracted_deadline"] else None,
    )
