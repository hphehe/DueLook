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


def test_parse_eml_preserves_html_and_plain_text():
    raw = b"""From: Alice <alice@example.com>
Subject: Rich email
Date: Mon, 15 Jun 2026 10:59:00 +0800
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary=rich

--rich
Content-Type: text/plain; charset=utf-8

Read the project page.
--rich
Content-Type: text/html; charset=utf-8

<p>Read the <a href="https://example.com/project">project page</a>.</p>
<img src="https://example.com/banner.png" alt="Project banner">
--rich--
"""
    record = parse_eml(raw, 'rich.eml')
    assert record.body == 'Read the project page.'
    assert 'https://example.com/project' in record.body_html
    assert 'https://example.com/banner.png' in record.body_html


def test_parse_eml_derives_plain_text_from_html_only_email():
    raw = b"""From: Alice <alice@example.com>
Subject: HTML only
Date: Mon, 15 Jun 2026 10:59:00 +0800
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8

<h1>Submission</h1><p>Upload by Friday.</p>
"""
    record = parse_eml(raw, 'html-only.eml')
    assert record.body == 'Submission\nUpload by Friday.'
    assert '<h1>Submission</h1>' in record.body_html
