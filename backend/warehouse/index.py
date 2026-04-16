"""
Warehouse API: управление складом (приход/расход товаров). v2
Доступ: Администратор и Менеджер.
"""
import json
import os
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


def main(event, context):
    method = event.get("httpMethod", "GET").upper()
    if method == "OPTIONS":
        return resp(200, {})

    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    conn = get_conn()
    try:
        user = get_user_by_token(conn, token)
        if not user or user["status"] == "blocked":
            return resp(401, {"error": "Не авторизован"})

        allowed = ["Администратор", "Менеджер"]
        if user["role"] not in allowed:
            return resp(403, {"error": "Нет доступа"})

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
    action = params.get("action", "items")

    if action == "items" or action == "":
        search = params.get("search", "")
        category = params.get("category", "")
        with conn.cursor() as cur:
            sql = (
                f"SELECT id, name, sku, unit, quantity, price, category, created_at, updated_at "
                f"FROM {SCHEMA}.warehouse_items WHERE 1=1"
            )
            args = []
            if search:
                sql += " AND (name ILIKE %s OR sku ILIKE %s)"
                args += [f"%{search}%", f"%{search}%"]
            if category:
                sql += " AND category = %s"
                args.append(category)
            sql += " ORDER BY name ASC"
            cur.execute(sql, args)
            rows = cur.fetchall()
        items = [{"id": r[0], "name": r[1], "sku": r[2], "unit": r[3],
                  "quantity": float(r[4]), "price": float(r[5]),
                  "category": r[6], "created_at": r[7], "updated_at": r[8]} for r in rows]
        return resp(200, {"ok": True, "items": items})

    if action == "transactions":
        item_id = params.get("item_id")
        tx_type = params.get("type")
        with conn.cursor() as cur:
            sql = (
                f"SELECT t.id, t.item_id, wi.name as item_name, t.work_order_id, "
                f"wo.number as work_order_number, t.type, t.quantity, t.price, "
                f"t.note, t.created_by, u.name as created_by_name, t.created_at "
                f"FROM {SCHEMA}.warehouse_transactions t "
                f"LEFT JOIN {SCHEMA}.warehouse_items wi ON wi.id = t.item_id "
                f"LEFT JOIN {SCHEMA}.work_orders wo ON wo.id = t.work_order_id "
                f"LEFT JOIN {SCHEMA}.users u ON u.id = t.created_by "
                f"WHERE 1=1"
            )
            args = []
            if item_id:
                sql += " AND t.item_id = %s"
                args.append(int(item_id))
            if tx_type:
                sql += " AND t.type = %s"
                args.append(tx_type)
            sql += " ORDER BY t.created_at DESC LIMIT 200"
            cur.execute(sql, args)
            rows = cur.fetchall()
        txs = [{"id": r[0], "item_id": r[1], "item_name": r[2],
                "work_order_id": r[3], "work_order_number": r[4],
                "type": r[5], "quantity": float(r[6]),
                "price": float(r[7]) if r[7] is not None else None,
                "note": r[8], "created_by": r[9], "created_by_name": r[10],
                "created_at": r[11]} for r in rows]
        return resp(200, {"ok": True, "transactions": txs})

    if action == "categories":
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT DISTINCT category FROM {SCHEMA}.warehouse_items "
                f"WHERE category IS NOT NULL ORDER BY category"
            )
            rows = cur.fetchall()
        cats = [r[0] for r in rows]
        return resp(200, {"ok": True, "categories": cats})

    if action == "stats":
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*), SUM(quantity * price) FROM {SCHEMA}.warehouse_items")
            row = cur.fetchone()
        return resp(200, {"ok": True, "total_items": row[0], "total_value": float(row[1] or 0)})

    return resp(400, {"error": "Неизвестное действие"})


def handle_post(conn, body, action, user):

    if action == "create_item":
        name = body.get("name", "").strip()
        if not name:
            return resp(400, {"error": "Название обязательно"})
        sku = body.get("sku", "").strip() or None
        unit = body.get("unit", "шт")
        quantity = float(body.get("quantity", 0))
        price = float(body.get("price", 0))
        category = body.get("category", "")
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.warehouse_items (name, sku, unit, quantity, price, category) "
                f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (name, sku, unit, quantity, price, category)
            )
            item_id = cur.fetchone()[0]
            # Если quantity > 0 — создаём транзакцию прихода
            if quantity > 0:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.warehouse_transactions (item_id, type, quantity, price, note, created_by) "
                    f"VALUES (%s, 'income', %s, %s, 'Начальный остаток', %s)",
                    (item_id, quantity, price, user["id"])
                )
        conn.commit()
        return resp(200, {"ok": True, "item_id": item_id})

    if action == "update_item":
        item_id = body.get("item_id")
        if not item_id:
            return resp(400, {"error": "item_id обязателен"})
        name = body.get("name", "").strip()
        sku = body.get("sku", "").strip() or None
        unit = body.get("unit", "шт")
        price = float(body.get("price", 0))
        category = body.get("category", "")
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.warehouse_items SET name=%s, sku=%s, unit=%s, price=%s, category=%s, updated_at=NOW() "
                f"WHERE id=%s",
                (name, sku, unit, price, category, item_id)
            )
        conn.commit()
        return resp(200, {"ok": True})

    if action == "income":
        # Приход товара
        item_id = body.get("item_id")
        quantity = float(body.get("quantity", 0))
        price = body.get("price")
        note = body.get("note", "")
        if not item_id or quantity <= 0:
            return resp(400, {"error": "item_id и quantity > 0 обязательны"})
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.warehouse_items SET quantity = quantity + %s, updated_at=NOW() WHERE id=%s",
                (quantity, item_id)
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.warehouse_transactions (item_id, type, quantity, price, note, created_by) "
                f"VALUES (%s, 'income', %s, %s, %s, %s) RETURNING id",
                (item_id, quantity, price, note, user["id"])
            )
            tx_id = cur.fetchone()[0]
        conn.commit()
        return resp(200, {"ok": True, "transaction_id": tx_id})

    if action == "expense":
        # Расход товара
        item_id = body.get("item_id")
        quantity = float(body.get("quantity", 0))
        work_order_id = body.get("work_order_id")
        note = body.get("note", "")
        if not item_id or quantity <= 0:
            return resp(400, {"error": "item_id и quantity > 0 обязательны"})
        with conn.cursor() as cur:
            cur.execute(f"SELECT quantity FROM {SCHEMA}.warehouse_items WHERE id=%s", (item_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Товар не найден"})
            if float(row[0]) < quantity:
                return resp(400, {"error": "Недостаточно товара на складе"})
            cur.execute(
                f"UPDATE {SCHEMA}.warehouse_items SET quantity = quantity - %s, updated_at=NOW() WHERE id=%s",
                (quantity, item_id)
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.warehouse_transactions (item_id, work_order_id, type, quantity, note, created_by) "
                f"VALUES (%s, %s, 'expense', %s, %s, %s) RETURNING id",
                (item_id, work_order_id, quantity, note, user["id"])
            )
            tx_id = cur.fetchone()[0]
        conn.commit()
        return resp(200, {"ok": True, "transaction_id": tx_id})

    return resp(400, {"error": "Неизвестное действие"})