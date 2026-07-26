import base64
import unittest

from email_content import extract_gmail_bodies, html_to_text


def encode(value: str) -> str:
    return base64.urlsafe_b64encode(value.encode()).decode().rstrip('=')


class EmailContentTests(unittest.TestCase):
    def test_extract_gmail_bodies_preserves_plain_and_html_parts(self):
        payload = {
            'mimeType': 'multipart/alternative',
            'parts': [
                {'mimeType': 'text/plain', 'body': {'data': encode('Plain deadline')}},
                {
                    'mimeType': 'multipart/related',
                    'parts': [
                        {'mimeType': 'text/html', 'body': {'data': encode(
                            '<p><a href="https://example.com">Deadline</a></p>'
                            '<img src="https://example.com/banner.png">'
                        )}}
                    ],
                },
            ],
        }

        body, body_html = extract_gmail_bodies(payload)

        self.assertEqual(body, 'Plain deadline')
        self.assertIn('https://example.com', body_html)
        self.assertIn('<img', body_html)

    def test_extract_gmail_bodies_uses_html_as_plain_fallback(self):
        html = '<style>p { color: red }</style><p>Hello&nbsp;<strong>there</strong></p>'
        body, body_html = extract_gmail_bodies({
            'mimeType': 'text/html',
            'body': {'data': encode(html)},
        })

        self.assertEqual(body, 'Hello there')
        self.assertEqual(body_html, html)

    def test_html_to_text_removes_hidden_content(self):
        self.assertEqual(html_to_text('<script>bad()</script><p>Safe</p>'), 'Safe')


if __name__ == '__main__':
    unittest.main()