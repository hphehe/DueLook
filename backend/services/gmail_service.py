import base64
import os
import re

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from db import get_db
from llm_service import analyze
from repositories import email_repository, user_repository
from schemas import EmailRecord, SyncResult

_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
_TOKEN_URI = "https://oauth2.googleapis.com/token"


def _extract_text(payload: dict) -> str:
    mime = payload.get("mimeType", "")
    if mime == "text/plain":
        data = payload.get("body", {}).get("data", "")
        if data:
            return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    for part in payload.get("parts", []):
        text = _extract_text(part)
        if text:
            return text
    if mime == "text/html":
        data = payload.get("body", {}).get("data", "")
        if data:
            html = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
            html = re.sub(r"<(style|script|head)[^>]*>.*?</(style|script|head)>", " ", html, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r"<[^>]+>", " ", html)
            return re.sub(r"\s+", " ", text).strip()
    return ""


#Sync emails from Gmail
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
        q="category:primary is:unread newer_than:30d",
        maxResults=10,
    ).execute()
    messages = result.get("messages", [])

    imported = 0
    skipped = 0

    for msg_ref in messages:
        msg_id = msg_ref["id"]
        record_id = f"{user_id}:gmail:{msg_id}"

        with get_db() as conn:
            if email_repository.find_by_id(conn, record_id, user_id):
                skipped += 1
                continue

        msg = service.users().messages().get(userId="me", id=msg_id, format="full").execute()
        payload = msg.get("payload", {})
        hdrs = {h["name"]: h["value"] for h in payload.get("headers", [])}
        body = _extract_text(payload) or "(no body)"

        record = EmailRecord(
            email_id=msg_id,
            sender=hdrs.get("From", "Unknown"),
            subject=hdrs.get("Subject", "(No Subject)"),
            received_date=hdrs.get("Date", ""),
            body=body[:3000],
            source_file=f"gmail:{msg_id}",
        )

        analyzed = analyze(record)
        analyzed.email_id = record_id

        with get_db() as conn:
            email_repository.upsert(conn, analyzed, user_id, record_id)

        imported += 1

    return SyncResult(imported=imported, skipped=skipped)
