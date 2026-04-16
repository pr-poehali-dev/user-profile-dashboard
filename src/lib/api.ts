import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url.auth;
const USERS_URL = func2url.users;

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
    }).then(async r => ({ status: r.status, data: await r.json() })),
};