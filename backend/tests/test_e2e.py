"""
End-to-end API workflow tests.

These tests show full user flow against
the real database. No steps are mocked except for the OpenAI LLM.
"""
from tests.conftest import cleanup_user
from tests.helpers import build_eml, unique_email


class TestRegisterImportAndManage:
    def test_full_lifecycle(self, client, mock_llm):
        """Register -> import -> list -> mark done -> delete -> recover."""
        email = unique_email()
        user_id = None
        try:
            #Register
            resp = client.post("/auth/register", json={"email": email, "password": "Pass123!"})
            assert resp.status_code == 200
            token = resp.json()["access_token"]
            user_id = resp.json()["user"]["user_id"]
            headers = {"Authorization": f"Bearer {token}"}

            #Import an email
            eml = build_eml("Project deadline", "Submit the report by 30 Jun 2026.")
            resp = client.post(
                "/emails/import",
                files={"file": ("project.eml", eml, "message/rfc822")},
                headers=headers,
            )
            assert resp.status_code == 200
            assert resp.json()["is_duplicate"] is False
            email_id = resp.json()["email"]["email_id"]

            #List - email appears
            resp = client.get("/emails", headers=headers)
            assert resp.status_code == 200
            assert any(e["email_id"] == email_id for e in resp.json()["emails"])

            #Mark done
            resp = client.post(f"/emails/{email_id}/done", headers=headers)
            assert resp.status_code == 204

            #Verify in DONE tab
            resp = client.get("/emails?tab=DONE", headers=headers)
            assert any(e["email_id"] == email_id for e in resp.json()["emails"])

            #Delete (move to BIN)
            resp = client.post(f"/emails/{email_id}/delete", headers=headers)
            assert resp.status_code == 204
            bin_emails = client.get("/emails?tab=BIN", headers=headers).json()["emails"]
            assert any(e["email_id"] == email_id for e in bin_emails)

            #Recover
            resp = client.post(f"/emails/{email_id}/recover", headers=headers)
            assert resp.status_code == 204
            bin_emails = client.get("/emails?tab=BIN", headers=headers).json()["emails"]
            assert not any(e["email_id"] == email_id for e in bin_emails)

        finally:
            if user_id:
                cleanup_user(user_id)

    def test_deadline_workflow(self, client, mock_llm):
        """Register -> import -> set deadline -> verify -> clear deadline -> verify."""
        email = unique_email()
        user_id = None
        try:
            resp = client.post("/auth/register", json={"email": email, "password": "Pass123!"})
            assert resp.status_code == 200
            token = resp.json()["access_token"]
            user_id = resp.json()["user"]["user_id"]
            headers = {"Authorization": f"Bearer {token}"}

            eml = build_eml("Exam timetable", "Final exam on 15 Dec 2026.")
            resp = client.post(
                "/emails/import",
                files={"file": ("exam.eml", eml, "message/rfc822")},
                headers=headers,
            )
            assert resp.status_code == 200
            email_id = resp.json()["email"]["email_id"]

            #Set deadline
            resp = client.post(
                f"/emails/{email_id}/set-deadline",
                json={"deadline": "2026-12-15T09:00:00"},
                headers=headers,
            )
            assert resp.status_code == 204

            #Verify deadline stored
            emails = client.get("/emails", headers=headers).json()["emails"]
            matched = next(e for e in emails if e["email_id"] == email_id)
            assert matched["extracted_deadline"] is not None
            assert "2026-12-15" in matched["extracted_deadline"]

            #Clear deadline
            client.post(f"/emails/{email_id}/set-deadline", json={"deadline": None}, headers=headers)
            emails = client.get("/emails", headers=headers).json()["emails"]
            matched = next(e for e in emails if e["email_id"] == email_id)
            assert matched["extracted_deadline"] is None

        finally:
            if user_id:
                cleanup_user(user_id)

    def test_duplicate_import_is_idempotent(self, client, mock_llm):
        """Importing the same .eml twice must not create a second record."""
        email = unique_email()
        user_id = None
        try:
            resp = client.post("/auth/register", json={"email": email, "password": "Pass123!"})
            token = resp.json()["access_token"]
            user_id = resp.json()["user"]["user_id"]
            headers = {"Authorization": f"Bearer {token}"}

            eml = build_eml("Idempotency check", "This should only appear once.")
            for i in range(3):
                files = {"file": ("same.eml", eml, "message/rfc822")}
                resp = client.post("/emails/import", files=files, headers=headers)
                assert resp.status_code == 200
                if i == 0:
                    assert resp.json()["is_duplicate"] is False
                else:
                    assert resp.json()["is_duplicate"] is True

            #Only one record in the DB
            all_emails = client.get("/emails", headers=headers).json()["emails"]
            subjects = [e["subject"] for e in all_emails if e["subject"] == "Idempotency check"]
            assert len(subjects) == 1

        finally:
            if user_id:
                cleanup_user(user_id)

    def test_user_isolation(self, client, mock_llm):
        """Two users must not see each other's emails."""
        user_a_id = user_b_id = None
        try:
            #Register user A
            resp_a = client.post("/auth/register", json={"email": unique_email(), "password": "Pass!"})
            token_a = resp_a.json()["access_token"]
            user_a_id = resp_a.json()["user"]["user_id"]
            headers_a = {"Authorization": f"Bearer {token_a}"}

            #Register user B
            resp_b = client.post("/auth/register", json={"email": unique_email(), "password": "Pass!"})
            token_b = resp_b.json()["access_token"]
            user_b_id = resp_b.json()["user"]["user_id"]
            headers_b = {"Authorization": f"Bearer {token_b}"}

            # A imports an email
            eml = build_eml("User A secret", "Only A should see this.")
            resp = client.post(
                "/emails/import",
                files={"file": ("a.eml", eml, "message/rfc822")},
                headers=headers_a,
            )
            email_id = resp.json()["email"]["email_id"]

            # B cannot see it
            b_emails = client.get("/emails", headers=headers_b).json()["emails"]
            assert not any(e["email_id"] == email_id for e in b_emails)

            # B cannot act on it
            assert client.post(f"/emails/{email_id}/done", headers=headers_b).status_code == 404

        finally:
            if user_a_id:
                cleanup_user(user_a_id)
            if user_b_id:
                cleanup_user(user_b_id)


class TestRealOpenAI:
    def test_real_openai_classifies_email(self, client):
        """Full pipeline with real OpenAI key. One test to verify LLM integration."""
        email = unique_email()
        user_id = None
        try:
            resp = client.post("/auth/register", json={"email": email, "password": "Pass123!"})
            assert resp.status_code == 200
            token = resp.json()["access_token"]
            user_id = resp.json()["user"]["user_id"]
            headers = {"Authorization": f"Bearer {token}"}

            eml = build_eml(
                subject="Assignment submission deadline",
                body="Please submit your CS2103T assignment by 30 Jun 2026 at 11:59 PM.",
            )
            resp = client.post(
                "/emails/import",
                files={"file": ("assignment.eml", eml, "message/rfc822")},
                headers=headers,
            )
            assert resp.status_code == 200
            result = resp.json()["email"]

            #LLM output is non-deterministic so I just assert shape, not exact values
            valid_tabs = {"FILTERED", "NO_DEADLINE", "NEEDS_REVIEW", "DONE", "MISSED"}
            assert result["category"] != ""
            assert result["tab"] in valid_tabs

        finally:
            if user_id:
                cleanup_user(user_id)


class TestHealthCheck:
    def test_health_endpoint(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}
