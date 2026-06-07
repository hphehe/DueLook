from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Security, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas import AnalyzedEmail, ImportResult, SetDeadlineRequest, SetTabRequest
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


@router.post("/{email_id}/done", status_code=204)
def mark_done(email_id: str, current_user=Depends(_current_user)):
    try:
        email_service.mark_done(email_id, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{email_id}/confirm", status_code=204)
def confirm(email_id: str, current_user=Depends(_current_user)):
    try:
        email_service.confirm(email_id, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{email_id}/dismiss", status_code=204)
def dismiss(email_id: str, current_user=Depends(_current_user)):
    try:
        email_service.dismiss(email_id, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{email_id}/set-tab", status_code=204)
def set_tab(email_id: str, body: SetTabRequest, current_user=Depends(_current_user)):
    try:
        email_service.set_tab(email_id, body.tab, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{email_id}/delete", status_code=204)
def delete_email(email_id: str, current_user=Depends(_current_user)):
    try:
        email_service.delete_email(email_id, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{email_id}/recover", status_code=204)
def recover_email(email_id: str, current_user=Depends(_current_user)):
    try:
        email_service.recover_email(email_id, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{email_id}/set-deadline", status_code=204)
def set_deadline(email_id: str, body: SetDeadlineRequest, current_user=Depends(_current_user)):
    try:
        email_service.set_deadline(email_id, body.deadline, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
