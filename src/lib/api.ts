import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url.auth;
const USERS_URL = func2url.users;
const POSTS_URL = func2url.posts;
const WAREHOUSE_URL = func2url.warehouse;

const TOKEN_KEY = "ap_token";
const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

async function callAuth(body: object, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Auth-Token"] = token;
  const res = await fetch(AUTH_URL, { method: "POST", headers, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}

async function callUsers(body: object) {
  const res = await fetch(USERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function getUsers(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${USERS_URL}${qs ? "?" + qs : ""}`, {
    method: "GET",
    headers: { "X-Auth-Token": getToken() },
  });
  return { status: res.status, data: await res.json() };
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    callAuth({ action: "register", name, email, password }),
  login: (email: string, password: string) =>
    callAuth({ action: "login", email, password }),
  verify2fa: (tmp_token: string, code: string) =>
    callAuth({ action: "verify_2fa", tmp_token, code }),
  me: (token: string) => fetch(AUTH_URL, {
    method: "GET", headers: { "X-Auth-Token": token },
  }).then(async r => ({ status: r.status, data: await r.json() })),
  logout: (token: string) =>
    callAuth({ action: "logout" }, token),

  // Users
  getUsers: (params?: { role?: string; search?: string }) =>
    getUsers(params as Record<string, string>),
  createUser: (name: string, email: string, password: string, role: string) =>
    callUsers({ action: "create", name, email, password, role }),
  toggleBlock: (user_id: number) =>
    callUsers({ action: "toggle_block", user_id }),
  updateRole: (user_id: number, role: string) =>
    callUsers({ action: "update_role", user_id, role }),
  updateUser: (user_id: number, name: string, email: string) =>
    callUsers({ action: "update_user", user_id, name, email }),

  getPublicProfile: (user_id: number | string) =>
    fetch(`${USERS_URL}?action=public_profile&user_id=${user_id}`, {
      method: "GET",
      headers: { "X-Auth-Token": getToken() },
    }).then(async r => ({ status: r.status, data: await r.json() })),

  // Posts & Work Orders
  getPosts: () =>
    fetch(`${POSTS_URL}?action=posts`, { method: "GET", headers: { "X-Auth-Token": getToken() } })
      .then(async r => ({ status: r.status, data: await r.json() })),
  getWorkOrders: (params?: { date?: string; post_id?: number }) => {
    const qs = new URLSearchParams({ action: "work_orders", ...(params as Record<string, string>) }).toString();
    return fetch(`${POSTS_URL}?${qs}`, { method: "GET", headers: { "X-Auth-Token": getToken() } })
      .then(async r => ({ status: r.status, data: await r.json() }));
  },
  createPost: (name: string, description: string) =>
    fetch(POSTS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "create_post", name, description }) })
      .then(async r => ({ status: r.status, data: await r.json() })),
  updatePost: (id: number, name: string, description: string, is_active: boolean) =>
    fetch(POSTS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "update_post", post_id: id, name, description, is_active }) })
      .then(async r => ({ status: r.status, data: await r.json() })),
  createWorkOrder: (data: object) =>
    fetch(POSTS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "create_work_order", ...data }) })
      .then(async r => ({ status: r.status, data: await r.json() })),
  updateWorkOrder: (id: number, data: object) =>
    fetch(POSTS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "update_work_order", order_id: id, ...data }) })
      .then(async r => ({ status: r.status, data: await r.json() })),

  // Warehouse
  getWarehouseItems: (params?: { search?: string; category?: string }) => {
    const qs = new URLSearchParams({ action: "items", ...(params as Record<string, string>) }).toString();
    return fetch(`${WAREHOUSE_URL}?${qs}`, { method: "GET", headers: { "X-Auth-Token": getToken() } })
      .then(async r => ({ status: r.status, data: await r.json() }));
  },
  getWarehouseTransactions: (params?: { item_id?: number; type?: string }) => {
    const qs = new URLSearchParams({ action: "transactions", ...(params as Record<string, string>) }).toString();
    return fetch(`${WAREHOUSE_URL}?${qs}`, { method: "GET", headers: { "X-Auth-Token": getToken() } })
      .then(async r => ({ status: r.status, data: await r.json() }));
  },
  getWarehouseCategories: () =>
    fetch(`${WAREHOUSE_URL}?action=categories`, { method: "GET", headers: { "X-Auth-Token": getToken() } })
      .then(async r => ({ status: r.status, data: await r.json() })),
  getWarehouseStats: () =>
    fetch(`${WAREHOUSE_URL}?action=stats`, { method: "GET", headers: { "X-Auth-Token": getToken() } })
      .then(async r => ({ status: r.status, data: await r.json() })),
  createWarehouseItem: (data: object) =>
    fetch(WAREHOUSE_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "create_item", ...data }) })
      .then(async r => ({ status: r.status, data: await r.json() })),
  updateWarehouseItem: (id: number, data: object) =>
    fetch(WAREHOUSE_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "update_item", item_id: id, ...data }) })
      .then(async r => ({ status: r.status, data: await r.json() })),
  warehouseIncome: (item_id: number, quantity: number, price: number, note: string) =>
    fetch(WAREHOUSE_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "income", item_id, quantity, price, note }) })
      .then(async r => ({ status: r.status, data: await r.json() })),
  warehouseExpense: (item_id: number, quantity: number, work_order_id?: number, note?: string) =>
    fetch(WAREHOUSE_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() }, body: JSON.stringify({ action: "expense", item_id, quantity, work_order_id, note }) })
      .then(async r => ({ status: r.status, data: await r.json() })),
};