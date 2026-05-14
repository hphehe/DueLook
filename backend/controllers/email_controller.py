from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from schemas import AnalyzedEmail
from services import email_service

router = APIRouter(prefix="/emails")


@router.post("/import", response_model=AnalyzedEmail)
async def import_email(file: UploadFile = File(...)):
    if not (file.filename or "").endswith(".eml"):
        raise HTTPException(status_code=400, detail="Only .eml files are supported")
    content = await file.read()
    return email_service.import_email(content, file.filename or "")


@router.get("", response_model=list[AnalyzedEmail])
def list_emails(tab: Optional[str] = Query(None)):
    return email_service.list_emails(tab)
