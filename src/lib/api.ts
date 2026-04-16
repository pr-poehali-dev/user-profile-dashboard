import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url.auth;

async function callAuth(body: object, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Auth-Token"] = token;
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function getMe(token: string) {
  const res = await fetch(AUTH_URL, {
    method: "GET",
    headers: { "X-Auth-Token": token },
  });
  return { status: res.status, data: await res.json() };
}

export const api = {
  register: (name: string, email: string, password: string) =>
    callAuth({ action: "register", name, email, password }),

  login: (email: string, password: string) =>
    callAuth({ action: "login", email, password }),

  verify2fa: (tmp_token: string, code: string) =>
    callAuth({ action: "verify_2fa", tmp_token, code }),

  me: (token: string) => getMe(token),

  logout: (token: string) =>
    callAuth({ action: "logout" }, token),
};
