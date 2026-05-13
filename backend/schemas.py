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
