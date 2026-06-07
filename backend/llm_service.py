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

Tab rules:
- tab=FILTERED: exactly one clear, actionable deadline date can be determined.
  - If no specific time is stated, use 23:59 on that date. Never invent a time.
  - Equivalent phrasings count as one deadline: "by end of 15 Apr" and "before 16 Apr" both mean 15 Apr 23:59.
- tab=NEEDS_REVIEW if any of these apply:
  - A task is required but no specific date is mentioned (e.g. "please submit your report").
  - The time is vague and cannot be pinned to a specific hour (e.g. "before evening", "sometime this week").
  - Two or more different deadline dates are mentioned for the same required action.
- tab=NO_DEADLINE: newsletters, announcements, or emails requiring no action from the student.

Deadline rules:
- extracted_deadline must be null for NEEDS_REVIEW and NO_DEADLINE.
- Never invent a time that is not stated or clearly inferable — use 23:59 when only a date is given.
- Multiple time references in one email do not automatically mean NEEDS_REVIEW — only flag if they represent genuinely conflicting deadlines for the same required action.

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

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        return AnalyzedEmail(
            **record.model_dump(),
            category="Others",
            tab="NEEDS_REVIEW",
            extracted_deadline=None,
        )
    return AnalyzedEmail(
        **record.model_dump(),
        category=result["category"],
        tab=result["tab"],
        extracted_deadline=result.get("extracted_deadline"),
    )
