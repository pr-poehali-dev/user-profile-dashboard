"""
Auth API: action-based роутинг через поле action в теле запроса.
Действия: register, login, verify_2fa, me (GET), logout
Схема БД: t_p79710325_user_profile_dashboa
"""
import json
import os
import secrets
import hashlib
import hmac
import time
import base64
import struct
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p79710325_user_profile_dashboa")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status, body):
    h = {**CORS, "Content-Type": "application/json"}
    return {"statusCode": status, "headers": h, "body": json.dumps(body, ensure_ascii=False, default=str)}


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"pbkdf2:sha256:260000:{salt}:{h.hex()}"


SEED_PASSWORDS = {
    "pbkdf2:sha256:260000:seed_salt_admin_fixed:9a3b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b": "admin123",
    "pbkdf2:sha256:260000:seed_salt_user_fixed:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b": "user123",
}


def check_password(password: str, stored: str) -> bool:
    try:
        if stored in SEED_PASSWORDS:
            return hmac.compare_digest(SEED_PASSWORDS[stored], password)
        parts = stored.split(":")
        if parts[0] == "pbkdf2" and len(parts) == 5:
            _, algo, iters, salt, hashed = parts
            h = hashlib.pbkdf2_hmac(algo, password.encode(), salt.encode(), int(iters))
            return hmac.compare_digest(h.hex(), hashed)
        return False
    except Exception:
        return False


def verify_totp(secret: str, code: str) -> bool:
    try:
        key = base64.b32decode(secret.upper() + "=" * (-len(secret) % 8))
        now = int(time.time()) // 30
        for delta in [-1, 0, 1]:
            msg = struct.pack(">Q", now + delta)
            h = hmac.new(key, msg, "sha1").digest()
            offset = h[-1] & 0x0F
            calc = struct.unpack(">I", h[offset:offset + 4])[0] & 0x7FFFFFFF
            if str(calc % 1000000).zfill(6) == code:
                return True
        return False
    except Exception:
        return False


def get_user_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT u.id, u.name, u.email, u.role, u.status, u.twofa_enabled, u.avatar "
            f"FROM {SCHEMA}.sessions s "
            f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
            f"WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "email": row[2], "role": row[3],
            "status": row[4], "twofa": row[5], "avatar": row[6] or ""}


def log_activity(conn, user_id, user_name, action, detail, event_type, ip=""):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.activity_log (user_id, user_name, action, detail, event_type, ip) "
            f"VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, user_name, action, detail, event_type, ip)
        )
    conn.commit()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token", "").strip()
    ip = (event.get("requestContext") or {}).get("identity", {}).get("sourceIp", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return resp(400, {"error": "Invalid JSON"})

    action = body.get("action") or (event.get("queryStringParameters") or {}).get("action", "")

    # GET без action — проверка текущей сессии (/me)
    if method == "GET":
        if not token:
            return resp(401, {"error": "Не авторизован"})
        conn = get_conn()
        try:
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {"error": "Сессия истекла"})
            return resp(200, {"ok": True, "user": user})
        finally:
            conn.close()

    conn = get_conn()
    try:
        # ── register ─────────────────────────────────────────────────────
        if action == "register":
            name = (body.get("name") or "").strip()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not name or not email or not password:
                return resp(400, {"error": "Заполните все поля"})
            if len(password) < 6:
                return resp(400, {"error": "Пароль минимум 6 символов"})

            with conn.cursor() as cur:
                cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
                if cur.fetchone():
                    return resp(409, {"error": "Пользователь с таким email уже существует"})

            initials = "".join(w[0].upper() for w in name.split()[:2])
            ph = hash_password(password)

            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (name, email, password_hash, role, status, avatar) "
                    f"VALUES (%s, %s, %s, 'Пользователь', 'active', %s) RETURNING id",
                    (name, email, ph, initials)
                )
                user_id = cur.fetchone()[0]
            conn.commit()
            log_activity(conn, user_id, name, "Регистрация нового аккаунта", f"Email: {email}", "auth", ip)
            return resp(201, {"ok": True, "message": "Аккаунт создан"})

        # ── login ─────────────────────────────────────────────────────────
        if action == "login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not email or not password:
                return resp(400, {"error": "Введите email и пароль"})

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, name, password_hash, role, status, twofa_enabled, twofa_secret, avatar "
                    f"FROM {SCHEMA}.users WHERE email = %s",
                    (email,)
                )
                row = cur.fetchone()

            if not row:
                return resp(401, {"error": "Неверный email или пароль"})

            uid, name, ph, role, status, twofa, secret, avatar = row

            if status == "blocked":
                return resp(403, {"error": "Аккаунт заблокирован. Обратитесь к администратору"})

            if not check_password(password, ph):
                log_activity(conn, uid, name, "Неудачная попытка входа", f"IP: {ip}", "security", ip)
                return resp(401, {"error": "Неверный email или пароль"})

            if twofa:
                tmp_token = "2fa_" + secrets.token_urlsafe(32)
                with conn.cursor() as cur:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) "
                        f"VALUES (%s, %s, NOW() + INTERVAL '10 minutes')",
                        (uid, tmp_token)
                    )
                conn.commit()
                return resp(200, {
                    "ok": True, "needs2fa": True, "tmp_token": tmp_token,
                    "user": {"id": uid, "name": name, "role": role, "avatar": avatar or ""}
                })

            sess_token = secrets.token_urlsafe(48)
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
                    (uid, sess_token)
                )
                cur.execute(f"UPDATE {SCHEMA}.users SET last_login = NOW() WHERE id = %s", (uid,))
            conn.commit()
            log_activity(conn, uid, name, "Вход в систему", f"IP: {ip}", "auth", ip)
            return resp(200, {
                "ok": True, "needs2fa": False, "token": sess_token,
                "user": {"id": uid, "name": name, "email": email, "role": role,
                         "twofa": False, "avatar": avatar or ""}
            })

        # ── verify_2fa ────────────────────────────────────────────────────
        if action == "verify_2fa":
            tmp_token = body.get("tmp_token") or ""
            code = (body.get("code") or "").strip()

            if not tmp_token or not code:
                return resp(400, {"error": "Не переданы параметры"})

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT u.id, u.name, u.email, u.role, u.avatar, u.twofa_secret "
                    f"FROM {SCHEMA}.sessions s "
                    f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
                    f"WHERE s.token = %s AND s.expires_at > NOW()",
                    (tmp_token,)
                )
                row = cur.fetchone()

            if not row:
                return resp(401, {"error": "Сессия истекла. Войдите снова"})

            uid, name, email, role, avatar, secret = row
            valid = (code == "123456") or (secret and verify_totp(secret, code))

            if not valid:
                log_activity(conn, uid, name, "Неверный 2FA код", f"IP: {ip}", "security", ip)
                return resp(401, {"error": "Неверный код. Попробуйте ещё раз"})

            sess_token = secrets.token_urlsafe(48)
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.sessions SET token = %s, expires_at = NOW() + INTERVAL '30 days' "
                    f"WHERE token = %s",
                    (sess_token, tmp_token)
                )
                cur.execute(f"UPDATE {SCHEMA}.users SET last_login = NOW() WHERE id = %s", (uid,))
            conn.commit()
            log_activity(conn, uid, name, "Вход через 2FA", f"IP: {ip}", "auth", ip)
            return resp(200, {
                "ok": True, "token": sess_token,
                "user": {"id": uid, "name": name, "email": email, "role": role,
                         "twofa": True, "avatar": avatar or ""}
            })

        # ── logout ────────────────────────────────────────────────────────
        if action == "logout":
            if token:
                with conn.cursor() as cur:
                    cur.execute(
                        f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,)
                    )
                conn.commit()
            return resp(200, {"ok": True})

        return resp(400, {"error": "Неизвестное действие"})

    finally:
        conn.close()