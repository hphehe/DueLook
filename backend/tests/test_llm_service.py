from unittest.mock import MagicMock, patch

import pytest
from pydantic import ValidationError

import llm_service
from schemas import EmailRecord, LLMAnalysisResponse


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


def _analysis(**overrides) -> LLMAnalysisResponse:
    defaults = dict(
        category="Academics",
        tab="FILTERED",
        extracted_deadline="2026-07-01T23:59:00",
    )
    defaults.update(overrides)
    return LLMAnalysisResponse(**defaults)


def _mock_response(parsed: LLMAnalysisResponse | None):
    response = MagicMock()
    response.choices = [MagicMock(message=MagicMock(parsed=parsed))]
    return response


def test_llm_schema_is_strict_and_requires_every_field():
    schema = LLMAnalysisResponse.model_json_schema()

    assert schema["additionalProperties"] is False
    assert set(schema["required"]) == {
        "category",
        "tab",
        "extracted_deadline",
    }


@pytest.mark.parametrize(
    "payload",
    [
        {
            "category": "Homework",
            "tab": "FILTERED",
            "extracted_deadline": "2026-07-01T23:59:00",
        },
        {
            "category": "Academics",
            "tab": "URGENT",
            "extracted_deadline": "2026-07-01T23:59:00",
        },
        {
            "category": "Academics",
            "tab": "FILTERED",
            "extracted_deadline": "next Friday",
        },
        {
            "category": "Academics",
            "tab": "FILTERED",
            "extracted_deadline": None,
        },
        {
            "category": "CCA",
            "tab": "NO_DEADLINE",
            "extracted_deadline": "2026-07-01T23:59:00",
        },
        {
            "category": "Others",
            "tab": "NO_DEADLINE",
            "extracted_deadline": None,
            "explanation": "Unexpected field",
        },
    ],
)
def test_llm_schema_rejects_invalid_output(payload):
    with pytest.raises(ValueError):
        LLMAnalysisResponse.model_validate(payload)


def test_analyze_uses_pydantic_structured_output():
    parsed = _analysis()
    with patch.object(
        llm_service.client.chat.completions,
        "parse",
        return_value=_mock_response(parsed),
    ) as parse:
        result = llm_service.analyze(_record())

    assert result.category == "Academics"
    assert result.tab == "FILTERED"
    assert result.extracted_deadline == "2026-07-01T23:59:00"

    request = parse.call_args.kwargs
    assert request["model"] == "gpt-5.4-nano"
    assert request["response_format"] is LLMAnalysisResponse
    assert [message["role"] for message in request["messages"]] == ["system", "user"]
    assert "Please submit by 1 Jul 2026." not in request["messages"][0]["content"]
    assert "Please submit by 1 Jul 2026." in request["messages"][1]["content"]


def test_analyze_retries_once_after_validation_failure():
    parsed = _analysis(category="CCA")
    with pytest.raises(ValidationError) as invalid:
        LLMAnalysisResponse.model_validate({
            "category": "Academics",
            "tab": "FILTERED",
            "extracted_deadline": None,
        })
    with patch.object(
        llm_service.client.chat.completions,
        "parse",
        side_effect=[invalid.value, _mock_response(parsed)],
    ) as parse:
        result = llm_service.analyze(_record())

    assert parse.call_count == 2
    assert result.category == "CCA"
    assert result.tab == "FILTERED"


def test_analyze_falls_back_after_two_invalid_responses():
    with pytest.raises(ValidationError) as invalid:
        LLMAnalysisResponse.model_validate({
            "category": "Academics",
            "tab": "FILTERED",
            "extracted_deadline": None,
        })

    with patch.object(
        llm_service.client.chat.completions,
        "parse",
        side_effect=invalid.value,
    ) as parse:
        result = llm_service.analyze(_record())

    assert parse.call_count == 2
    assert result.category == "Others"
    assert result.tab == "NEEDS_REVIEW"
    assert result.extracted_deadline is None


def test_analyze_retries_empty_parsed_response_then_falls_back():
    with patch.object(
        llm_service.client.chat.completions,
        "parse",
        return_value=_mock_response(None),
    ) as parse:
        result = llm_service.analyze(_record())

    assert parse.call_count == 2
    assert result.tab == "NEEDS_REVIEW"
    assert result.extracted_deadline is None
