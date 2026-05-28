from typing import Optional

from db import get_db
from file_parser import parse_eml
from llm_service import analyze
from repositories import email_repository
from schemas import AnalyzedEmail, ImportResult


def import_email(file_bytes: bytes, filename: str) -> ImportResult:
    record = parse_eml(file_bytes, filename)
    with get_db() as conn:
        existing = email_repository.find_by_id(conn, record.email_id)
        if existing:
            return ImportResult(email=existing, is_duplicate=True)
        analyzed = analyze(record)
        email_repository.upsert(conn, analyzed)
        return ImportResult(email=analyzed, is_duplicate=False)


def list_emails(tab: Optional[str]) -> list[AnalyzedEmail]:
    with get_db() as conn:
        return email_repository.get_all(conn, tab)
