CREATE TABLE IF NOT EXISTS users (
    user_id         TEXT PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    password_salt   TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    token       TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS email_state (
    email_id           TEXT PRIMARY KEY,
    user_id            TEXT,
    sender             TEXT NOT NULL,
    subject            TEXT NOT NULL,
    received_date      TIMESTAMPTZ,
    body               TEXT NOT NULL,
    source_file        TEXT NOT NULL,
    category           TEXT NOT NULL,
    tab                TEXT NOT NULL,
    extracted_deadline TIMESTAMPTZ,
    pre_delete_tab     TEXT,
    processed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

