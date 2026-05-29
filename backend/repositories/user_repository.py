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


def find_session(conn, token: str):
	with conn.cursor() as cur:
		cur.execute(
			"""
			SELECT s.user_id, u.email, s.expires_at
			FROM auth_sessions s
			JOIN users u ON u.user_id = s.user_id
			WHERE s.token = %s
			""",
			(token,),
		)
		row = cur.fetchone()
		if not row:
			return None
		return {"user_id": row[0], "email": row[1], "expires_at": row[2]}
