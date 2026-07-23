from file_parser import parse_eml


def _build_eml(subject: str = 'Project deadline', body: str = 'Please submit by Friday.') -> bytes:
    return f"""From: Alice <alice@example.com>
To: bob@example.com
Subject: {subject}
Date: Mon, 15 Jun 2026 10:59:00 +0800
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

{body}
""".encode('utf-8')


def test_parse_eml_extracts_core_fields():
    record = parse_eml(_build_eml(), 'sample.eml')

    assert record.sender == 'Alice <alice@example.com>'
    assert record.subject == 'Project deadline'
    assert record.received_date == 'Mon, 15 Jun 2026 10:59:00 +0800'
    assert record.body == 'Please submit by Friday.'
    assert record.source_file == 'sample.eml'
    assert len(record.email_id) == 16


def test_parse_eml_body_falls_back_to_empty_string_for_headers_only_message():
    raw = b"""From: Alice <alice@example.com>
Subject: No body here
Date: Mon, 15 Jun 2026 10:59:00 +0800

"""
    record = parse_eml(raw, 'headers-only.eml')

    assert record.body == ''
