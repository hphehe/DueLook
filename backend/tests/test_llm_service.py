import json
from unittest.mock import MagicMock, patch

import llm_service
from schemas import EmailRecord


def _record(**overrides) -> EmailRecord:
    defaults = dict(
        email_id="abc123",
        sender="Registrar <registrar@uni.edu>",
        subject="Assignment due",
        received_date="Mon, 15 Jun 2026 10:59:00 +0800",
        body="Please submit by 1 Jul 2026.",
        source_file="sample.eml",
    )
    defaults.update(overrides)
    return EmailRecord(**defaults)


def _mock_response(content: str):
    response = MagicMock()
    response.choices = [MagicMock(message=MagicMock(content=content))]
    return response


def test_analyze_parses_valid_json_response():
    raw = json.dumps({
        "category": "Academics",
        "tab": "FILTERED",
        "extracted_deadline": "2026-07-01T23:59:00",
    })
    with patch.object(llm_service.client.chat.completions, "create", return_value=_mock_response(raw)):
        result = llm_service.analyze(_record())

    assert result.category == "Academics"
    assert result.tab == "FILTERED"
    assert result.extracted_deadline == "2026-07-01T23:59:00"


def test_analyze_strips_markdown_code_fences():
    raw = "```json\n" + json.dumps({
        "category": "CCA",
        "tab": "NO_DEADLINE",
        "extracted_deadline": None,
    }) + "\n```"
    with patch.object(llm_service.client.chat.completions, "create", return_value=_mock_response(raw)):
        result = llm_service.analyze(_record())

    assert result.category == "CCA"
    assert result.tab == "NO_DEADLINE"
    assert result.extracted_deadline is None


def test_analyze_falls_back_to_needs_review_on_malformed_json():
    with patch.object(llm_service.client.chat.completions, "create", return_value=_mock_response("not json")):
        result = llm_service.analyze(_record())

    assert result.category == "Others"
    assert result.tab == "NEEDS_REVIEW"
    assert result.extracted_deadline is None
