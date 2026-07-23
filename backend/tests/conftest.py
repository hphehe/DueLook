import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

os.environ.setdefault("GROQ_API_KEY", "test-key")

from main import app          
from db import get_db        
from schemas import AnalyzedEmail 
from tests.helpers import unique_email, build_eml  


def cleanup_user(user_id: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM email_state WHERE user_id = %s", (user_id,))
            cur.execute("DELETE FROM auth_sessions WHERE user_id = %s", (user_id,))
            cur.execute("DELETE FROM users WHERE user_id = %s", (user_id,))


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_llm():
    """Stub llm_service.analyze so tests never call the real Groq API."""
    def _fake(record):
        return AnalyzedEmail(
            email_id=record.email_id,
            sender=record.sender,
            subject=record.subject,
            received_date=record.received_date,
            body=record.body,
            source_file=record.source_file,
            category="Academics",
            tab="FILTERED",
            extracted_deadline=None,
        )
    with patch("services.email_service.analyze", side_effect=_fake):
        yield


@pytest.fixture
def registered_user(client):
    email = unique_email()
    resp = client.post("/auth/register", json={"email": email, "password": "TestPass123!"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    user_id = data["user"]["user_id"]
    yield {
        "email": email,
        "password": "TestPass123!",
        "token": data["access_token"],
        "user_id": user_id,
    }
    cleanup_user(user_id)


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}


@pytest.fixture
def another_user(client):
    """A second independent user for ownership tests."""
    email = unique_email()
    resp = client.post("/auth/register", json={"email": email, "password": "OtherPass456!"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    user_id = data["user"]["user_id"]
    yield {
        "email": email,
        "token": data["access_token"],
        "user_id": user_id,
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }
    cleanup_user(user_id)


@pytest.fixture
def imported_email(client, auth_headers, mock_llm):
    """Import one .eml for the current user; return the AnalyzedEmail dict."""
    eml = build_eml("Assignment Due", "Please submit your assignment by 1 Jul 2026.")
    resp = client.post(
        "/emails/import",
        files={"file": ("assignment.eml", eml, "message/rfc822")},
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["email"]
