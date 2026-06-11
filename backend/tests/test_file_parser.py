import unittest

from file_parser import parse_eml


def build_eml(subject: str = 'Project deadline', body: str = 'Please submit by Friday.') -> bytes:
    raw = f"""From: Alice <alice@example.com>
To: bob@example.com
Subject: {subject}
Date: Mon, 15 Jun 2026 10:59:00 +0800
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

{body}
"""
    return raw.encode('utf-8')


class ParseEmlTests(unittest.TestCase):
    def test_parse_eml_extracts_core_fields(self):
        record = parse_eml(build_eml(), 'sample.eml')

        self.assertEqual(record.sender, 'Alice <alice@example.com>')
        self.assertEqual(record.subject, 'Project deadline')
        self.assertEqual(record.received_date, 'Mon, 15 Jun 2026 10:59:00 +0800')
        self.assertEqual(record.body, 'Please submit by Friday.')
        self.assertEqual(record.source_file, 'sample.eml')
        self.assertEqual(len(record.email_id), 16)

    def test_parse_eml_body_falls_back_to_empty_string_for_headers_only_message(self):
        raw = b"""From: Alice <alice@example.com>
Subject: No body here
Date: Mon, 15 Jun 2026 10:59:00 +0800

"""
        record = parse_eml(raw, 'headers-only.eml')

        self.assertEqual(record.body, '')


if __name__ == '__main__':
    unittest.main()
