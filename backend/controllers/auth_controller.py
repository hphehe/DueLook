from fastapi import APIRouter, Depends, HTTPException, Security
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