import unittest

from schemas import LLMAnalysisResponse, SetDeadlineRequest


class FloatingDeadlineTests(unittest.TestCase):
    def test_ai_deadline_discards_positive_offset_without_shifting_hour(self):
        result = LLMAnalysisResponse(
            category="Academics",
            tab="FILTERED",
            extracted_deadline="2026-07-01T17:00:00+08:00",
            confidence=0.95,
            review_reason="NONE",
        )

        self.assertEqual(result.extracted_deadline, "2026-07-01T17:00:00")

    def test_ai_deadline_discards_z_without_shifting_hour(self):
        result = LLMAnalysisResponse(
            category="Academics",
            tab="FILTERED",
            extracted_deadline="2026-07-01T17:00:00Z",
            confidence=0.95,
            review_reason="NONE",
        )

        self.assertEqual(result.extracted_deadline, "2026-07-01T17:00:00")

    def test_manual_deadline_is_canonicalized_as_floating_time(self):
        request = SetDeadlineRequest(deadline="2026-07-01T17:00+08:00")

        self.assertEqual(request.deadline, "2026-07-01T17:00:00")

    def test_invalid_deadline_is_rejected(self):
        with self.assertRaises(ValueError):
            SetDeadlineRequest(deadline="2026-02-30T17:00:00")


if __name__ == "__main__":
    unittest.main()
