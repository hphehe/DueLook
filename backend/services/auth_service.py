import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from db import get_db
from repositories import user_repository
from schemas import AuthToken, UserProfile

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