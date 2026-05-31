from pydantic import BaseModel
from typing import Optional


class EmailRecord(BaseModel):
    email_id: str
    sender: str
    subject: str
    received_date: str
    body: str
    source_file: str


class AnalyzedEmail(EmailRecord):
    category: str
    tab: str
    extracted_deadline: Optional[str] = None


class ImportResult(BaseModel):
    email: AnalyzedEmail
    is_duplicate: bool


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    user_id: str
    email: str


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
