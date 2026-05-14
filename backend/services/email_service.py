from typing import Optional

from db import get_db
from file_parser import parse_eml
from llm_service import analyze
from repositories import email_repository
from schemas import AnalyzedEmail


def import_email(file_bytes: bytes, filename: str) -> AnalyzedEmail:
    record = parse_eml(file_bytes, filename)
    analyzed = analyze(record)
    with get_db() as conn:
        email_repository.upsert(conn, analyzed)
    return analyzed


def list_emails(tab: Optional[str]) -> list[AnalyzedEmail]:
    with get_db() as conn:
        return email_repository.get_all(conn, tab)
