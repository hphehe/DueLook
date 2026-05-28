import email
import hashlib
from email import policy
from schemas import EmailRecord


def _make_id(sender: str, subject: str, received_date: str) -> str:
    raw = f"{sender}{subject}{received_date}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _extract_body(msg) -> str:
    body = msg.get_body(preferencelist=("plain",))
    if body:
        return body.get_content().strip()
    body = msg.get_body(preferencelist=("html",))
    if body:
        return body.get_content().strip()
    return ""


def parse_eml(file_bytes: bytes, filename: str) -> EmailRecord:
    msg = email.message_from_bytes(file_bytes, policy=policy.default)
    sender = str(msg.get("from", ""))
    subject = str(msg.get("subject", ""))
    received_date = str(msg.get("date", ""))
    body = _extract_body(msg)
    return EmailRecord(
        email_id=_make_id(sender, subject, received_date),
        sender=sender,
        subject=subject,
        received_date=received_date,
        body=body,
        source_file=filename,
    )
