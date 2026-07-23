from tests.conftest import cleanup_user
from tests.helpers import unique_email


class TestRegister:
    def test_success_returns_token_and_profile(self, client):
        email = unique_email()
        resp = client.post("/auth/register", json={"email": email, "password": "pass123"})
        user_id = resp.json()["user"]["user_id"]
        try:
            assert resp.status_code == 200
            data = resp.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == email
            assert data["user"]["has_gmail"] is False
        finally:
            cleanup_user(user_id)

    def test_duplicate_email_returns_400(self, client, registered_user):
        resp = client.post("/auth/register", json={
            "email": registered_user["email"],
            "password": "different",
        })
        assert resp.status_code == 400

    def test_email_normalised_to_lowercase(self, client):
        email = unique_email()
        resp = client.post("/auth/register", json={"email": email.upper(), "password": "pass"})
        user_id = resp.json()["user"]["user_id"]
        try:
            assert resp.status_code == 200
            assert resp.json()["user"]["email"] == email.lower()
        finally:
            cleanup_user(user_id)


class TestLogin:
    def test_valid_credentials_return_token(self, client, registered_user):
        resp = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_wrong_password_returns_401(self, client, registered_user):
        resp = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": "notthepassword",
        })
        assert resp.status_code == 401

    def test_unknown_email_returns_401(self, client):
        resp = client.post("/auth/login", json={
            "email": "ghost@nowhere.com",
            "password": "pass",
        })
        assert resp.status_code == 401

    def test_login_email_case_insensitive(self, client, registered_user):
        resp = client.post("/auth/login", json={
            "email": registered_user["email"].upper(),
            "password": registered_user["password"],
        })
        assert resp.status_code == 200


class TestMe:
    def test_returns_profile_for_valid_token(self, client, registered_user, auth_headers):
        resp = client.get("/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == registered_user["email"]
        assert data["user_id"] == registered_user["user_id"]
        assert data["has_gmail"] is False

    def test_missing_token_returns_401(self, client):
        assert client.get("/auth/me").status_code == 401

    def test_invalid_token_returns_401(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer notarealtoken"})
        assert resp.status_code == 401

    def test_malformed_auth_header_returns_401(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "NotBearer abc"})
        assert resp.status_code == 401
