import uuid


def create_user(conn, email: str, password_salt: str, password_hash: str):
	user_id = str(uuid.uuid4())
	with conn.cursor() as cur:
		cur.execute(
			"""
			INSERT INTO users (user_id, email, password_salt, password_hash)
			VALUES (%s, %s, %s, %s)
			RETURNING user_id, email
			""",
			(user_id, email, password_salt, password_hash),
		)
		row = cur.fetchone()
	return {"user_id": row[0], "email": row[1]}


def find_by_email(conn, email: str):
	with conn.cursor() as cur:
		cur.execute(
			"""
			SELECT user_id, email, password_salt, password_hash
			FROM users
			WHERE email = %s
			""",
			(email,),
		)
		row = cur.fetchone()
		if not row:
			return None
		return {
			"user_id": row[0],
			"email": row[1],
			"password_salt": row[2],
			"password_hash": row[3],
		}


def find_by_id(conn, user_id: str):
	with conn.cursor() as cur:
		cur.execute(
			"""
			SELECT user_id, email
			FROM users
			WHERE user_id = %s
			""",
			(user_id,),
		)
		row = cur.fetchone()
		if not row:
			return None
		return {"user_id": row[0], "email": row[1]}


def create_session(conn, user_id: str, token: str, expires_at):
	with conn.cursor() as cur:
		cur.execute(
			"""
			INSERT INTO auth_sessions (token, user_id, expires_at)
			VALUES (%s, %s, %s)
			""",
			(token, user_id, expires_at),
		)


def find_by_google_id(conn, google_id: str):
	with conn.cursor() as cur:
		cur.execute(
			"SELECT user_id, email FROM users WHERE google_id = %s",
			(google_id,),
		)
		row = cur.fetchone()
		if not row:
			return None
		return {"user_id": row[0], "email": row[1]}


def create_google_user(conn, email: str, google_id: str, refresh_token: str):
	user_id = str(uuid.uuid4())
	with conn.cursor() as cur:
		cur.execute(
			"""
			INSERT INTO users (user_id, email, password_salt, password_hash, google_id, google_refresh_token)
			VALUES (%s, %s, NULL, NULL, %s, %s)
			RETURNING user_id, email
			""",
			(user_id, email, google_id, refresh_token),
		)
		row = cur.fetchone()
	return {"user_id": row[0], "email": row[1]}


def link_google(conn, user_id: str, google_id: str, refresh_token: str):
	with conn.cursor() as cur:
		cur.execute(
			"UPDATE users SET google_id = %s, google_refresh_token = %s WHERE user_id = %s",
			(google_id, refresh_token, user_id),
		)


def update_google_refresh_token(conn, user_id: str, refresh_token: str):
	with conn.cursor() as cur:
		cur.execute(
			"UPDATE users SET google_refresh_token = %s WHERE user_id = %s",
			(refresh_token, user_id),
		)


def get_google_refresh_token(conn, user_id: str):
	with conn.cursor() as cur:
		cur.execute(
			"SELECT google_refresh_token FROM users WHERE user_id = %s",
			(user_id,),
		)
		row = cur.fetchone()
		return row[0] if row else None


def find_session(conn, token: str):
	with conn.cursor() as cur:
		cur.execute(
			"""
			SELECT s.user_id, u.email, s.expires_at, u.google_refresh_token IS NOT NULL AS has_gmail
			FROM auth_sessions s
			JOIN users u ON u.user_id = s.user_id
			WHERE s.token = %s
			""",
			(token,),
		)
		row = cur.fetchone()
		if not row:
			return None
		return {"user_id": row[0], "email": row[1], "expires_at": row[2], "has_gmail": row[3]}
