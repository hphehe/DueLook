from tests.helpers import build_eml


def _import(client, headers, subject="Test Email", body="Test body", filename="test.eml"):
    eml = build_eml(subject, body)
    return client.post(
        "/emails/import",
        files={"file": (filename, eml, "message/rfc822")},
        headers=headers,
    )


class TestImport:
    def test_import_eml_returns_email(self, client, auth_headers, mock_llm):
        resp = _import(client, auth_headers, subject="Deadline Notice")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"]["subject"] == "Deadline Notice"
        assert data["is_duplicate"] is False

    def test_import_populates_llm_fields(self, client, auth_headers, mock_llm):
        resp = _import(client, auth_headers)
        email = resp.json()["email"]
        assert email["category"] == "Academics"
        assert email["tab"] == "FILTERED"
        assert email["extracted_deadline"] is None

    def test_duplicate_import_returns_flag(self, client, auth_headers, mock_llm):
        eml = build_eml("Same Subject", "Same body")
        files = {"file": ("dup.eml", eml, "message/rfc822")}
        client.post("/emails/import", files=files, headers=auth_headers)
        #Re-upload identical bytes - parser produces the same email_id
        files = {"file": ("dup.eml", eml, "message/rfc822")}
        resp = client.post("/emails/import", files=files, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["is_duplicate"] is True

    def test_non_eml_file_rejected(self, client, auth_headers):
        resp = client.post(
            "/emails/import",
            files={"file": ("notes.txt", b"some content", "text/plain")},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_import_requires_auth(self, client):
        eml = build_eml()
        resp = client.post(
            "/emails/import",
            files={"file": ("test.eml", eml, "message/rfc822")},
        )
        assert resp.status_code == 401


class TestList:
    def test_list_returns_imported_email(self, client, auth_headers, mock_llm, imported_email):
        resp = client.get("/emails", headers=auth_headers)
        assert resp.status_code == 200
        ids = [e["email_id"] for e in resp.json()["emails"]]
        assert imported_email["email_id"] in ids

    def test_list_filtered_by_tab(self, client, auth_headers, mock_llm, imported_email):
        resp = client.get("/emails?tab=FILTERED", headers=auth_headers)
        assert resp.status_code == 200
        assert all(e["tab"] == "FILTERED" for e in resp.json()["emails"])

    def test_list_requires_auth(self, client):
        assert client.get("/emails").status_code == 401

    def test_users_cannot_see_each_others_emails(
        self, client, auth_headers, mock_llm, imported_email, another_user
    ):
        resp = client.get("/emails", headers=another_user["headers"])
        ids = [e["email_id"] for e in resp.json()["emails"]]
        assert imported_email["email_id"] not in ids


class TestMarkDone:
    def test_mark_done_moves_to_done_tab(self, client, auth_headers, mock_llm, imported_email):
        email_id = imported_email["email_id"]
        resp = client.post(f"/emails/{email_id}/done", headers=auth_headers)
        assert resp.status_code == 204
        done = client.get("/emails?tab=DONE", headers=auth_headers).json()["emails"]
        assert any(e["email_id"] == email_id for e in done)

    def test_mark_done_requires_auth(self, client, mock_llm, imported_email):
        resp = client.post(f"/emails/{imported_email['email_id']}/done")
        assert resp.status_code == 401

    def test_mark_done_wrong_user_returns_404(
        self, client, mock_llm, imported_email, another_user
    ):
        resp = client.post(
            f"/emails/{imported_email['email_id']}/done",
            headers=another_user["headers"],
        )
        assert resp.status_code == 404


class TestDeleteAndRecover:
    def test_delete_moves_to_bin(self, client, auth_headers, mock_llm, imported_email):
        email_id = imported_email["email_id"]
        resp = client.post(f"/emails/{email_id}/delete", headers=auth_headers)
        assert resp.status_code == 204
        bin_emails = client.get("/emails?tab=BIN", headers=auth_headers).json()["emails"]
        assert any(e["email_id"] == email_id for e in bin_emails)

    def test_recover_restores_from_bin(self, client, auth_headers, mock_llm, imported_email):
        email_id = imported_email["email_id"]
        client.post(f"/emails/{email_id}/delete", headers=auth_headers)
        resp = client.post(f"/emails/{email_id}/recover", headers=auth_headers)
        assert resp.status_code == 204
        #Should no longer appear in BIN
        bin_emails = client.get("/emails?tab=BIN", headers=auth_headers).json()["emails"]
        assert not any(e["email_id"] == email_id for e in bin_emails)

    def test_delete_wrong_user_returns_404(
        self, client, mock_llm, imported_email, another_user
    ):
        resp = client.post(
            f"/emails/{imported_email['email_id']}/delete",
            headers=another_user["headers"],
        )
        assert resp.status_code == 404


class TestSetTab:
    def test_set_tab_to_done(self, client, auth_headers, mock_llm, imported_email):
        email_id = imported_email["email_id"]
        resp = client.post(
            f"/emails/{email_id}/set-tab",
            json={"tab": "DONE"},
            headers=auth_headers,
        )
        assert resp.status_code == 204

    def test_invalid_tab_returns_400(self, client, auth_headers, mock_llm, imported_email):
        resp = client.post(
            f"/emails/{imported_email['email_id']}/set-tab",
            json={"tab": "INVALID_TAB"},
            headers=auth_headers,
        )
        assert resp.status_code == 400


class TestSetDeadline:
    def test_set_deadline_persists(self, client, auth_headers, mock_llm, imported_email):
        email_id = imported_email["email_id"]
        deadline = "2026-12-31T23:59:00"
        resp = client.post(
            f"/emails/{email_id}/set-deadline",
            json={"deadline": deadline},
            headers=auth_headers,
        )
        assert resp.status_code == 204
        emails = client.get("/emails", headers=auth_headers).json()["emails"]
        matched = next(e for e in emails if e["email_id"] == email_id)
        assert matched["extracted_deadline"] is not None
        assert "2026-12-31" in matched["extracted_deadline"]

    def test_clear_deadline(self, client, auth_headers, mock_llm, imported_email):
        email_id = imported_email["email_id"]
        client.post(f"/emails/{email_id}/set-deadline", json={"deadline": "2026-12-31T23:59:00"}, headers=auth_headers)
        resp = client.post(f"/emails/{email_id}/set-deadline", json={"deadline": None}, headers=auth_headers)
        assert resp.status_code == 204
        emails = client.get("/emails", headers=auth_headers).json()["emails"]
        matched = next(e for e in emails if e["email_id"] == email_id)
        assert matched["extracted_deadline"] is None
