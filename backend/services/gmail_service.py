import os
from concurrent.futures import ThreadPoolExecutor

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from db import get_db
from email_content import extract_gmail_bodies
from llm_service import analyze
from repositories import email_repository, user_repository
from schemas import EmailRecord, SyncResult

_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
_TOKEN_URI = "https://oauth2.googleapis.com/token"


# Sync emails from Gmail
def sync(user_id: str) -> SyncResult:
    with get_db() as conn:
        refresh_token = user_repository.get_google_refresh_token(conn, user_id)

    if not refresh_token:
        raise ValueError("No Gmail connection. Please sign in with Google first.")

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=_TOKEN_URI,
        client_id=_CLIENT_ID,
        client_secret=_CLIENT_SECRET,
    )
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)

    result = service.users().messages().list(
        userId="me",
        labelIds=["INBOX"],
        q="category:primary newer_than:30d",
        maxResults=10,
    ).execute()
    messages = result.get("messages", [])

    skipped = 0
    updated = 0
    to_analyze: list[tuple[str, EmailRecord]] = []

    for msg_ref in messages:
        msg_id = msg_ref["id"]
        record_id = f"{user_id}:gmail:{msg_id}"

        with get_db() as conn:
            existing = email_repository.find_by_id(conn, record_id, user_id)
        if existing and existing.body_html is not None:
            skipped += 1
            continue

        msg = service.users().messages().get(userId="me", id=msg_id, format="full").execute()
        payload = msg.get("payload", {})
        hdrs = {h["name"]: h["value"] for h in payload.get("headers", [])}
        body, body_html = extract_gmail_bodies(payload)
        body = body or "(no body)"

        if existing:
            with get_db() as conn:
                email_repository.update_content(
                    conn,
                    record_id,
                    user_id,
                    body[:3000],
                    body_html or "",
                )
            if body_html:
                updated += 1
            else:
                skipped += 1
            continue

        to_analyze.append((record_id, EmailRecord(
            email_id=msg_id,
            sender=hdrs.get("From", "Unknown"),
            subject=hdrs.get("Subject", "(No Subject)"),
            received_date=hdrs.get("Date", ""),
            body=body[:3000],
            body_html=body_html or "",
            source_file=f"gmail:{msg_id}",
        )))

    def _classify(item: tuple) -> tuple:
        record_id, record = item
        analyzed = analyze(record)
        analyzed.email_id = record_id
        return record_id, analyzed

    imported = 0
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(_classify, to_analyze))
    for record_id, analyzed in results:
        with get_db() as conn:
            email_repository.upsert(conn, analyzed, user_id, record_id)
        imported += 1

    return SyncResult(imported=imported, skipped=skipped, updated=updated)
