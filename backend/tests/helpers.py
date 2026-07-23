import uuid


def unique_email() -> str:
    return f"ci_{uuid.uuid4().hex[:10]}@duelook-ci.test"


def build_eml(subject: str = "Test Subject", body: str = "Test body") -> bytes:
    return (
        f"From: Sender <sender@example.com>\r\n"
        f"To: recipient@example.com\r\n"
        f"Subject: {subject}\r\n"
        f"Date: Mon, 15 Jun 2026 10:00:00 +0800\r\n"
        f"MIME-Version: 1.0\r\n"
        f"Content-Type: text/plain; charset=utf-8\r\n"
        f"\r\n"
        f"{body}\r\n"
    ).encode("utf-8")
