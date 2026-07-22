import email
import hashlib
from email import policy

from email_content import html_to_text
from schemas import EmailRecord


def _make_id(sender: str, subject: str, received_date: str) -> str:
    raw = f"{sender}{subject}{received_date}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _extract_bodies(msg) -> tuple[str, str | None]:
    plain_part = msg.get_body(preferencelist=("plain",))
    html_part = msg.get_body(preferencelist=("html",))
    body_html = html_part.get_content().strip() if html_part else None
    body = (
        plain_part.get_content().strip()
        if plain_part
        else html_to_text(body_html or "")
    )
    return body, body_html


def parse_eml(file_bytes: bytes, filename: str) -> EmailRecord:
    msg = email.message_from_bytes(file_bytes, policy=policy.default)
    sender = str(msg.get("from", ""))
    subject = str(msg.get("subject", ""))
    received_date = str(msg.get("date", ""))
    body, body_html = _extract_bodies(msg)
    return EmailRecord(
        email_id=_make_id(sender, subject, received_date),
        sender=sender,
        subject=subject,
        received_date=received_date,
        body=body,
        body_html=body_html,
        source_file=filename,
    )
