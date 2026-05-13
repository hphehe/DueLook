import os
import json
import re
from dotenv import load_dotenv
from groq import Groq
from schemas import EmailRecord, AnalyzedEmail

load_dotenv()
client = Groq(api_key=os.environ["GROQ_API_KEY"])

PROMPT = """You are an email classifier for a university student.

Analyze this email and return ONLY valid JSON with this exact structure:
{{
  "category": "<Academics|CCA|Housing|Internships|Programs|Others>",
  "tab": "<FILTERED|NEEDS_REVIEW|NO_DEADLINE>",
  "extracted_deadline": "<ISO 8601 datetime string or null>"
}}

Rules:
- tab=FILTERED if there is a clear, specific, actionable deadline and you are confident
- tab=NEEDS_REVIEW if there seems to be a deadline but the date is ambiguous or unclear
- tab=NO_DEADLINE for newsletters, announcements, or emails requiring no action
- extracted_deadline must be null for NO_DEADLINE emails

Email:
From: {sender}
Subject: {subject}
Date: {received_date}
Body: {body}"""


def analyze(record: EmailRecord) -> AnalyzedEmail:
    prompt = PROMPT.format(
        sender=record.sender,
        subject=record.subject,
        received_date=record.received_date,
        body=record.body,
    )
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```json\s*|^```\s*|```$", "", raw, flags=re.MULTILINE).strip()

    result = json.loads(raw)
    return AnalyzedEmail(
        **record.model_dump(),
        category=result["category"],
        tab=result["tab"],
        extracted_deadline=result.get("extracted_deadline"),
    )
