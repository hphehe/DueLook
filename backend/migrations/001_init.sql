CREATE TABLE IF NOT EXISTS email_state (
    email_id           TEXT PRIMARY KEY,
    sender             TEXT NOT NULL,
    subject            TEXT NOT NULL,
    received_date      TIMESTAMPTZ,
    body               TEXT NOT NULL,
    source_file        TEXT NOT NULL,
    category           TEXT NOT NULL,
    tab                TEXT NOT NULL,
    extracted_deadline TIMESTAMPTZ,
    processed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

