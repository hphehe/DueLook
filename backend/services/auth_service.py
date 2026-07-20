import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import requests as http_requests
from google_auth_oauthlib.flow import Flow

from db import get_db
from repositories import user_repository
from schemas import AuthToken, UserProfile

_GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
_GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
_GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
_FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
]

#In-memory PKCE store: state -> code_verifier (short-lived, cleared after use)
_pkce_store: dict[str, str] = {}


def _make_flow() -> Flow:
    client_config = {
        "web": {
            "client_id": _GOOGLE_CLIENT_ID,
            "client_secret": _GOOGLE_CLIENT_SECRET,
            "redirect_uris": [_GOOGLE_REDIRECT_URI],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    return Flow.from_client_config(client_config, scopes=_SCOPES, redirect_uri=_GOOGLE_REDIRECT_URI)


def _pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(96)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge

SESSION_TTL_DAYS = 7
PBKDF2_ROUNDS = 200000


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ROUNDS,
    ).hex()


def _verify_password(password: str, salt: str, expected_hash: str) -> bool:
    actual_hash = _hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def _create_session_token() -> str:
    return secrets.token_urlsafe(32)


def _issue_token(user: dict, conn) -> AuthToken:
    token = _create_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    user_repository.create_session(conn, user["user_id"], token, expires_at)
    return AuthToken(
        access_token=token,
        user=UserProfile(user_id=user["user_id"], email=user["email"]),
    )


def register(email: str, password: str) -> AuthToken:
    normalized_email = _normalize_email(email)
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    with get_db() as conn:
        existing = user_repository.find_by_email(conn, normalized_email)
        if existing:
            raise ValueError("Email is already registered")
        user = user_repository.create_user(conn, normalized_email, salt, password_hash)
        return _issue_token(user, conn)


def login(email: str, password: str) -> AuthToken:
    normalized_email = _normalize_email(email)
    with get_db() as conn:
        user = user_repository.find_by_email(conn, normalized_email)
        if not user or not _verify_password(password, user["password_salt"], user["password_hash"]):
            raise ValueError("Invalid email or password")
        return _issue_token(user, conn)


def google_oauth_url() -> str:
    flow = _make_flow()
    verifier, challenge = _pkce_pair()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        code_challenge=challenge,
        code_challenge_method="S256",
    )
    _pkce_store[state] = verifier
    return auth_url


def google_oauth_callback(code: str, state: str) -> AuthToken:
    verifier = _pkce_store.pop(state, "")
    flow = _make_flow()
    flow.fetch_token(code=code, code_verifier=verifier)
    credentials = flow.credentials

    resp = http_requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {credentials.token}"},
        timeout=10,
    )
    resp.raise_for_status()
    info = resp.json()
    google_id = info["id"]
    email = info["email"]
    refresh_token = credentials.refresh_token or ""

    with get_db() as conn:
        user = user_repository.find_by_google_id(conn, google_id)
        if user:
            if refresh_token:
                user_repository.update_google_refresh_token(conn, user["user_id"], refresh_token)
        else:
            existing = user_repository.find_by_email(conn, email)
            if existing:
                user_repository.link_google(conn, existing["user_id"], google_id, refresh_token)
                user = existing
            else:
                user = user_repository.create_google_user(conn, email, google_id, refresh_token)
        return _issue_token(user, conn)


def get_current_user(token: str):
    with get_db() as conn:
        session = user_repository.find_session(conn, token)
        if not session:
            raise ValueError("Invalid or expired session")
        expires_at = session["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise ValueError("Invalid or expired session")
        return UserProfile(user_id=session["user_id"], email=session["email"])