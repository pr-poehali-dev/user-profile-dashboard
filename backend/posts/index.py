"""
Posts API: управление постами (рабочими местами) и наряд-заказами. v3
Посты: создание/редактирование/удаление — только Администратор.
Наряд-заказы: создание — Администратор и Менеджер.
"""
import json
import os
import psycopg2
from datetime import datetime, timedelta

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


def get_user_by_token(conn, token):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT u.id, u.name, u.role, u.status FROM {SCHEMA}.users u "
            f"JOIN {SCHEMA}.sessions s ON s.user_id = u.id "
            f"WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "role": row[2], "status": row[3]}


def handler(event, context):
    method = event.get("httpMethod", "GET").upper()
    if method == "OPTIONS":
        return resp(200, {})

    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    conn = get_conn()
    try:
        user = get_user_by_token(conn, token)
        if not user or user["status"] == "blocked":
            return resp(401, {"error": "Не авторизован"})

        if method == "GET":
            return handle_get(conn, event, user)
        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            action = body.get("action", "")
            return handle_post(conn, body, action, user)
        else:
            return resp(405, {"error": "Метод не поддерживается"})
    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)})
    finally:
        conn.close()


def handle_get(conn, event, user):
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    if action == "work_orders" or action == "":
        # Получить все наряд-заказы с постами
        post_id = params.get("post_id")
        date_str = params.get("date")
        with conn.cursor() as cur:
            sql = (
                f"SELECT wo.id, wo.number, wo.post_id, p.name as post_name, "
                f"wo.client_name, wo.client_phone, wo.car_model, wo.car_plate, "
                f"wo.description, wo.start_time, wo.duration_hours, wo.end_time, "
                f"wo.status, wo.created_by, u.name as created_by_name, wo.created_at "
                f"FROM {SCHEMA}.work_orders wo "
                f"LEFT JOIN {SCHEMA}.posts p ON p.id = wo.post_id "
                f"LEFT JOIN {SCHEMA}.users u ON u.id = wo.created_by "
                f"WHERE 1=1"
            )
            args = []
            if post_id:
                sql += " AND wo.post_id = %s"
                args.append(int(post_id))
            if date_str:
                sql += " AND wo.start_time >= %s::date AND wo.start_time < %s::date + INTERVAL '1 day'"
                args.append(date_str)
                args.append(date_str)
            sql += " ORDER BY wo.start_time ASC"
            cur.execute(sql, args)
            rows = cur.fetchall()
        orders = []
        for r in rows:
            orders.append({
                "id": r[0], "number": r[1], "post_id": r[2], "post_name": r[3],
                "client_name": r[4], "client_phone": r[5], "car_model": r[6],
                "car_plate": r[7], "description": r[8],
                "start_time": r[9], "duration_hours": float(r[10]),
                "end_time": r[11], "status": r[12],
                "created_by": r[13], "created_by_name": r[14], "created_at": r[15]
            })
        return resp(200, {"ok": True, "work_orders": orders})

    if action == "posts":
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT p.id, p.name, p.description, p.is_active, p.created_at, u.name as created_by_name "
                f"FROM {SCHEMA}.posts p LEFT JOIN {SCHEMA}.users u ON u.id = p.created_by "
                f"ORDER BY p.id ASC"
            )
            rows = cur.fetchall()
        posts = [{"id": r[0], "name": r[1], "description": r[2], "is_active": r[3],
                  "created_at": r[4], "created_by_name": r[5]} for r in rows]
        return resp(200, {"ok": True, "posts": posts})

    if action == "post_schedule":
        # Расписание конкретного поста
        post_id = params.get("post_id")
        date_str = params.get("date")
        if not post_id:
            return resp(400, {"error": "post_id обязателен"})
        with conn.cursor() as cur:
            sql = (
                f"SELECT wo.id, wo.number, wo.client_name, wo.car_model, wo.car_plate, "
                f"wo.start_time, wo.duration_hours, wo.end_time, wo.status "
                f"FROM {SCHEMA}.work_orders wo "
                f"WHERE wo.post_id = %s"
            )
            args = [int(post_id)]
            if date_str:
                sql += " AND wo.start_time >= %s::date AND wo.start_time < %s::date + INTERVAL '1 day'"
                args.append(date_str)
                args.append(date_str)
            sql += " ORDER BY wo.start_time ASC"
            cur.execute(sql, args)
            rows = cur.fetchall()
        orders = [{"id": r[0], "number": r[1], "client_name": r[2], "car_model": r[3],
                   "car_plate": r[4], "start_time": r[5], "duration_hours": float(r[6]),
                   "end_time": r[7], "status": r[8]} for r in rows]
        return resp(200, {"ok": True, "schedule": orders})

    return resp(400, {"error": "Неизвестное действие"})


def handle_post(conn, body, action, user):
    admin_roles = ["Администратор", "Менеджер"]
    admin_only = ["Администратор"]

    if action == "create_post":
        if user["role"] not in admin_only:
            return resp(403, {"error": "Только администратор может создавать посты"})
        name = body.get("name", "").strip()
        if not name:
            return resp(400, {"error": "Название поста обязательно"})
        desc = body.get("description", "")
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.posts (name, description, created_by) VALUES (%s, %s, %s) RETURNING id",
                (name, desc, user["id"])
            )
            post_id = cur.fetchone()[0]
        conn.commit()
        return resp(200, {"ok": True, "post_id": post_id})

    if action == "update_post":
        if user["role"] not in admin_only:
            return resp(403, {"error": "Только администратор может редактировать посты"})
        post_id = body.get("post_id")
        name = body.get("name", "").strip()
        desc = body.get("description", "")
        is_active = body.get("is_active", True)
        if not post_id or not name:
            return resp(400, {"error": "post_id и name обязательны"})
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.posts SET name=%s, description=%s, is_active=%s WHERE id=%s",
                (name, desc, is_active, post_id)
            )
        conn.commit()
        return resp(200, {"ok": True})

    if action == "create_work_order":
        if user["role"] not in admin_roles:
            return resp(403, {"error": "Только администратор или менеджер может создавать наряд-заказы"})
        post_id = body.get("post_id")
        client_name = body.get("client_name", "")
        client_phone = body.get("client_phone", "")
        car_model = body.get("car_model", "")
        car_plate = body.get("car_plate", "")
        description = body.get("description", "")
        start_time = body.get("start_time")
        duration_hours = body.get("duration_hours", 1)

        if not post_id or not start_time:
            return resp(400, {"error": "post_id и start_time обязательны"})

        # Проверка пересечения времени
        try:
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            end_dt = start_dt + timedelta(hours=float(duration_hours))
        except Exception:
            return resp(400, {"error": "Неверный формат start_time"})

        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, number FROM {SCHEMA}.work_orders "
                f"WHERE post_id = %s AND status != 'cancelled' "
                f"AND start_time < %s AND (end_time IS NOT NULL AND end_time > %s OR end_time IS NULL AND start_time + (duration_hours * INTERVAL '1 hour') > %s)",
                (post_id, end_dt, start_dt, start_dt)
            )
            conflict = cur.fetchone()
        if conflict:
            return resp(409, {"error": f"Пост занят: наряд-заказ №{conflict[1]}"})

        # Генерация номера
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.work_orders")
            count = cur.fetchone()[0]
        number = f"НЗ-{str(count + 1).zfill(6)}"

        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.work_orders "
                f"(number, post_id, client_name, client_phone, car_model, car_plate, "
                f"description, start_time, duration_hours, end_time, status, created_by) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s) RETURNING id",
                (number, post_id, client_name, client_phone, car_model, car_plate,
                 description, start_dt, float(duration_hours), end_dt, user["id"])
            )
            order_id = cur.fetchone()[0]
        conn.commit()
        return resp(200, {"ok": True, "id": order_id, "number": number})

    if action == "update_work_order":
        if user["role"] not in admin_roles:
            return resp(403, {"error": "Нет доступа"})
        order_id = body.get("order_id")
        status = body.get("status")
        if not order_id:
            return resp(400, {"error": "order_id обязателен"})
        fields = []
        vals = []
        if status:
            fields.append("status=%s")
            vals.append(status)
        if body.get("client_name") is not None:
            fields.append("client_name=%s")
            vals.append(body["client_name"])
        if body.get("car_model") is not None:
            fields.append("car_model=%s")
            vals.append(body["car_model"])
        if body.get("car_plate") is not None:
            fields.append("car_plate=%s")
            vals.append(body["car_plate"])
        if body.get("description") is not None:
            fields.append("description=%s")
            vals.append(body["description"])
        if not fields:
            return resp(400, {"error": "Нет полей для обновления"})
        fields.append("updated_at=NOW()")
        vals.append(order_id)
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.work_orders SET {', '.join(fields)} WHERE id=%s",
                vals
            )
        conn.commit()
        return resp(200, {"ok": True})

    return resp(400, {"error": "Неизвестное действие"})