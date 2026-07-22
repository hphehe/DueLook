import base64
import html
import re
from typing import Optional


def html_to_text(value: str) -> str:
    without_hidden = re.sub(
        r"<(style|script|head)[^>]*>.*?</\1>",
        " ",
        value,
        flags=re.DOTALL | re.IGNORECASE,
    )
    with_breaks = re.sub(
        r"</?(?:br|p|div|li|tr|h[1-6])[^>]*>",
        "\n",
        without_hidden,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"<[^>]+>", " ", with_breaks)
    decoded = html.unescape(text).replace("\xa0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in decoded.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def _decode_base64url(data: str) -> str:
    if not data:
        return ""
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded).decode("utf-8", errors="replace")


def _find_part(payload: dict, mime_type: str) -> Optional[dict]:
    if payload.get("mimeType") == mime_type and payload.get("body", {}).get("data"):
        return payload
    for part in payload.get("parts", []):
        found = _find_part(part, mime_type)
        if found:
            return found
    return None


def extract_gmail_bodies(payload: dict) -> tuple[str, Optional[str]]:
    plain_part = _find_part(payload, "text/plain")
    html_part = _find_part(payload, "text/html")

    body_html = None
    if html_part:
        body_html = (
            _decode_base64url(html_part.get("body", {}).get("data", "")).strip()
            or None
        )

    body = ""
    if plain_part:
        body = _decode_base64url(plain_part.get("body", {}).get("data", "")).strip()
    elif body_html:
        body = html_to_text(body_html)

    return body, body_html