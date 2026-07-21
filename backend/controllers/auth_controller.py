import os

from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas import AuthToken, LoginRequest, RegisterRequest, UserProfile
from services import auth_service

router = APIRouter(prefix="/auth")
bearer_scheme = HTTPBearer(auto_error=False)


def _token_from_scheme(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return credentials.credentials


@router.post("/register", response_model=AuthToken)
def register(payload: RegisterRequest):
    try:
        return auth_service.register(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=AuthToken)
def login(payload: LoginRequest):
    try:
        return auth_service.login(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/me", response_model=UserProfile)
def me(token: str = Depends(_token_from_scheme)):
    try:
        return auth_service.get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/google")
def google_login():
    try:
        return RedirectResponse(auth_service.google_oauth_url())
    except Exception:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(f"{frontend_url}?auth_error=Configuration+error")


@router.get("/google/callback")
def google_callback(code: str = Query(...), state: str = Query("")):
    import traceback
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    try:
        token_data = auth_service.google_oauth_callback(code, state)
        return RedirectResponse(f"{frontend_url}?token={token_data.access_token}")
    except Exception:
        traceback.print_exc()
        return RedirectResponse(f"{frontend_url}?auth_error=Google+sign-in+failed")