from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Security, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas import AnalyzedEmail, ImportResult
from services import auth_service
from services import email_service

router = APIRouter(prefix="/emails")
bearer_scheme = HTTPBearer(auto_error=False)


def _current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        return auth_service.get_current_user(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/import", response_model=ImportResult)
async def import_email(file: UploadFile = File(...), current_user=Depends(_current_user)):
    if not (file.filename or "").endswith(".eml"):
        raise HTTPException(status_code=400, detail="Only .eml files are supported")
    content = await file.read()
    return email_service.import_email(content, file.filename or "", current_user.user_id)


@router.get("", response_model=list[AnalyzedEmail])
def list_emails(tab: Optional[str] = Query(None), current_user=Depends(_current_user)):
    return email_service.list_emails(tab, current_user.user_id)
