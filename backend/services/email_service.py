from typing import Optional

from db import get_db
from file_parser import parse_eml
from llm_service import analyze
from repositories import email_repository
from schemas import AnalyzedEmail, ImportResult, PaginatedEmailsResult


def import_email(file_bytes: bytes, filename: str, user_id: str) -> ImportResult:
    record = parse_eml(file_bytes, filename)
    record_id = f"{user_id}:{record.email_id}"
    with get_db() as conn:
        existing = email_repository.find_by_id(conn, record_id, user_id)
        if existing:
            if record.body_html and not existing.body_html:
                email_repository.update_content(
                    conn,
                    record_id,
                    user_id,
                    record.body,
                    record.body_html,
                )
                existing = existing.model_copy(update={
                    "body": record.body,
                    "body_html": record.body_html,
                })
            return ImportResult(email=existing, is_duplicate=True)
        analyzed = analyze(record)
        analyzed.email_id = record_id
        email_repository.upsert(conn, analyzed, user_id, record_id)
        return ImportResult(email=analyzed, is_duplicate=False)


def search_emails(query: str, user_id: str) -> list[AnalyzedEmail]:
    with get_db() as conn:
        return email_repository.search(conn, query, user_id)


def list_emails(tab: Optional[str], user_id: str, page: int = 1, limit: int = 20) -> PaginatedEmailsResult:
    offset = (page - 1) * limit
    with get_db() as conn:
        email_repository.mark_missed(conn, user_id)
        total = email_repository.count_all(conn, tab, user_id)
        emails = email_repository.get_all(conn, tab, user_id, limit=limit, offset=offset)
    total_pages = max(1, -(-total // limit))  # ceiling division
    return PaginatedEmailsResult(emails=emails, total=total, page=page, limit=limit, total_pages=total_pages)


def mark_done(email_id: str, user_id: str) -> None:
    with get_db() as conn:
        found = email_repository.mark_done(conn, email_id, user_id)
    if not found:
        raise ValueError(f"Email {email_id} not found or already done")


def confirm(email_id: str, user_id: str) -> None:
    with get_db() as conn:
        found = email_repository.confirm(conn, email_id, user_id)
    if not found:
        raise ValueError(f"Email {email_id} has no suggested deadline to confirm")


def dismiss(email_id: str, user_id: str) -> None:
    with get_db() as conn:
        found = email_repository.dismiss(conn, email_id, user_id)
    if not found:
        raise ValueError(f"Email {email_id} not found or not in NEEDS_REVIEW")


_VALID_TABS = {'FILTERED', 'NEEDS_REVIEW', 'NO_DEADLINE', 'DONE', 'MISSED'}


def set_tab(email_id: str, new_tab: str, user_id: str) -> None:
    if new_tab not in _VALID_TABS:
        raise ValueError(f"Invalid tab: {new_tab}")
    with get_db() as conn:
        found = email_repository.set_tab(conn, email_id, new_tab, user_id)
    if not found:
        raise ValueError(f"Email {email_id} not found")


def delete_email(email_id: str, user_id: str) -> None:
    with get_db() as conn:
        found = email_repository.delete_email(conn, email_id, user_id)
    if not found:
        raise ValueError(f"Email {email_id} not found or already in bin")


def recover_email(email_id: str, user_id: str) -> None:
    with get_db() as conn:
        found = email_repository.recover_email(conn, email_id, user_id)
    if not found:
        raise ValueError(f"Email {email_id} not found in bin")


def set_deadline(email_id: str, new_deadline: Optional[str], user_id: str) -> None:
    with get_db() as conn:
        found = email_repository.set_deadline(conn, email_id, new_deadline, user_id)
    if not found:
        raise ValueError(f"Email {email_id} not found or in bin")
