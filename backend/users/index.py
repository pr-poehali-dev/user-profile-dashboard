"""
Users API: список, создание, обновление роли/статуса, блокировка.
Все запросы требуют X-Auth-Token администратора или менеджера.
Схема БД: t_p79710325_user_profile_dashboa
"""
import json
import os
import secrets
import hashlib
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p79710325_user_profile_dashboa")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}
ADMIN_ROLES = ("Администратор", "Менеджер")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status, body):
    h = {**CORS, "Content-Type": "application/json"}
    return {"statusCode": status, "headers": h,
            "body": json.dumps(body, ensure_ascii=False, default=str)}


def get_session_user(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s "
            f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
            f"WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "role": row[2]}


def log_activity(conn, user_id, user_name, action, detail, event_type="users"):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.activity_log (user_id, user_name, action, detail, event_type) "
            f"VALUES (%s, %s, %s, %s, %s)",
            (user_id, user_name, action, detail, event_type)
        )
    conn.commit()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"pbkdf2:sha256:260000:{salt}:{h.hex()}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token", "").strip()
    qs = event.get("queryStringParameters") or {}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return resp(400, {"error": "Invalid JSON"})

    conn = get_conn()
    try:
        caller = get_session_user(conn, token)
        if not caller:
            return resp(401, {"error": "Не авторизован"})
        if caller["role"] not in ADMIN_ROLES:
            return resp(403, {"error": "Недостаточно прав"})

        action = body.get("action") or qs.get("action", "")

        # ── GET /  — список пользователей ────────────────────────────────
        if method == "GET":
            role_filter = qs.get("role", "")
            search = qs.get("search", "").strip()

            sql = (
                f"SELECT id, name, email, role, status, twofa_enabled, avatar, "
                f"created_at, last_login FROM {SCHEMA}.users WHERE 1=1"
            )
            params = []
            if role_filter:
                sql += " AND role = %s"
                params.append(role_filter)
            if search:
                sql += " AND (LOWER(name) LIKE %s OR LOWER(email) LIKE %s)"
                params += [f"%{search.lower()}%", f"%{search.lower()}%"]
            sql += " ORDER BY id"

            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()

            users = [
                {
                    "id": r[0], "name": r[1], "email": r[2], "role": r[3],
                    "status": r[4], "twofa": r[5], "avatar": r[6] or "",
                    "created_at": r[7], "last_login": r[8],
                }
                for r in rows
            ]
            return resp(200, {"ok": True, "users": users, "total": len(users)})

        # ── POST actions ──────────────────────────────────────────────────

        # create — создать нового пользователя
        if action == "create":
            name = (body.get("name") or "").strip()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            role = body.get("role") or "Пользователь"

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
                    f"VALUES (%s, %s, %s, %s, 'active', %s) RETURNING id",
                    (name, email, ph, role, initials)
                )
                new_id = cur.fetchone()[0]
            conn.commit()
            log_activity(conn, caller["id"], caller["name"],
                         "Добавлен новый пользователь", f"{name} ({email})")
            return resp(201, {"ok": True, "id": new_id})

        # toggle_block — заблокировать / разблокировать
        if action == "toggle_block":
            uid = body.get("user_id")
            if not uid:
                return resp(400, {"error": "user_id обязателен"})
            if uid == caller["id"]:
                return resp(400, {"error": "Нельзя заблокировать себя"})

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT status, name FROM {SCHEMA}.users WHERE id = %s", (uid,)
                )
                row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Пользователь не найден"})

            cur_status, target_name = row
            new_status = "active" if cur_status == "blocked" else "blocked"

            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET status = %s WHERE id = %s",
                    (new_status, uid)
                )
            conn.commit()
            action_label = "Аккаунт разблокирован" if new_status == "active" else "Аккаунт заблокирован"
            log_activity(conn, caller["id"], caller["name"],
                         action_label, f"Пользователь: {target_name}", "security")
            return resp(200, {"ok": True, "new_status": new_status})

        # update_role — сменить роль
        if action == "update_role":
            uid = body.get("user_id")
            new_role = body.get("role")
            allowed_roles = ["Администратор", "Менеджер", "Модератор", "Пользователь"]
            if not uid or new_role not in allowed_roles:
                return resp(400, {"error": "Неверные параметры"})

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT name, role FROM {SCHEMA}.users WHERE id = %s", (uid,)
                )
                row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Пользователь не найден"})

            target_name, old_role = row
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s", (new_role, uid)
                )
            conn.commit()
            log_activity(conn, caller["id"], caller["name"],
                         "Роль изменена",
                         f"{target_name}: {old_role} → {new_role}")
            return resp(200, {"ok": True})

        # update_user — обновить имя/email
        if action == "update_user":
            uid = body.get("user_id")
            name = (body.get("name") or "").strip()
            email = (body.get("email") or "").strip().lower()
            if not uid or not name or not email:
                return resp(400, {"error": "Неверные параметры"})

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.users WHERE email = %s AND id != %s",
                    (email, uid)
                )
                if cur.fetchone():
                    return resp(409, {"error": "Email уже занят"})

            initials = "".join(w[0].upper() for w in name.split()[:2])
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET name = %s, email = %s, avatar = %s WHERE id = %s",
                    (name, email, initials, uid)
                )
            conn.commit()
            log_activity(conn, caller["id"], caller["name"],
                         "Данные пользователя обновлены", f"ID: {uid}")
            return resp(200, {"ok": True})

        return resp(400, {"error": "Неизвестное действие"})

    finally:
        conn.close()
