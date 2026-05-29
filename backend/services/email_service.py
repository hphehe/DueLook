from typing import Optional

from db import get_db
from file_parser import parse_eml
from llm_service import analyze
from repositories import email_repository
from schemas import AnalyzedEmail, ImportResult


def import_email(file_bytes: bytes, filename: str, user_id: str) -> ImportResult:
    record = parse_eml(file_bytes, filename)
    record_id = f"{user_id}:{record.email_id}"
    with get_db() as conn:
        existing = email_repository.find_by_id(conn, record_id, user_id)
        if existing:
            return ImportResult(email=existing, is_duplicate=True)
        analyzed = analyze(record)
        analyzed.email_id = record_id
        email_repository.upsert(conn, analyzed, user_id, record_id)
        return ImportResult(email=analyzed, is_duplicate=False)


def list_emails(tab: Optional[str], user_id: str) -> list[AnalyzedEmail]:
    with get_db() as conn:
        return email_repository.get_all(conn, tab, user_id)
