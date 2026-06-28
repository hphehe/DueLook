import os
from contextlib import contextmanager

import psycopg2
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv

load_dotenv()
_pool = SimpleConnectionPool(1, 10, dsn=os.environ["DATABASE_URL"])


def _initialize_schema():
    conn = _pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS auth_sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    expires_at TIMESTAMPTZ NOT NULL
                );

                CREATE TABLE IF NOT EXISTS email_state (
                    email_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    sender TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    received_date TIMESTAMPTZ,
                    body TEXT NOT NULL,
                    source_file TEXT NOT NULL,
                    category TEXT NOT NULL,
                    tab TEXT NOT NULL,
                    extracted_deadline TIMESTAMPTZ,
                    pre_delete_tab TEXT,
                    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                "ALTER TABLE email_state ADD COLUMN IF NOT EXISTS user_id TEXT"
            )
            cur.execute(
                "ALTER TABLE email_state ADD COLUMN IF NOT EXISTS pre_delete_tab TEXT"
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


_initialize_schema()


@contextmanager
def get_db():
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)
