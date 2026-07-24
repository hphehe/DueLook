from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class EmailRecord(BaseModel):
    email_id: str
    sender: str
    subject: str
    received_date: str
    body: str
    body_html: Optional[str] = None
    source_file: str


class AnalyzedEmail(EmailRecord):
    category: str
    tab: str
    extracted_deadline: Optional[str] = None


class LLMAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: Literal[
        "Academics",
        "CCA",
        "Housing",
        "Internships",
        "Programs",
        "Others",
    ]
    tab: Literal["FILTERED", "NEEDS_REVIEW", "NO_DEADLINE"]
    extracted_deadline: Optional[str]

    @field_validator("extracted_deadline")
    @classmethod
    def validate_deadline_format(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if "T" not in value and " " not in value:
            raise ValueError("Deadline must include an ISO 8601 time")
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("Deadline must be an ISO 8601 datetime") from exc
        return value

    @model_validator(mode="after")
    def validate_deadline_matches_tab(self) -> "LLMAnalysisResponse":
        if self.tab == "FILTERED" and self.extracted_deadline is None:
            raise ValueError("FILTERED requires a deadline")
        if self.tab != "FILTERED" and self.extracted_deadline is not None:
            raise ValueError("Only FILTERED emails may have a deadline")
        return self


class ImportResult(BaseModel):
    email: AnalyzedEmail
    is_duplicate: bool


class SetTabRequest(BaseModel):
    tab: str


class SetDeadlineRequest(BaseModel):
    deadline: Optional[str] = None


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    user_id: str
    email: str
    has_gmail: bool = False


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class SyncResult(BaseModel):
    imported: int
    skipped: int
    updated: int = 0
