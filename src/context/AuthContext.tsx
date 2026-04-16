import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "Администратор" | "Менеджер" | "Модератор" | "Пользователь";
  twofa: boolean;
  avatar: string;
};

type AuthStep = "idle" | "2fa";

type AuthContextType = {
  user: AuthUser | null;
  authStep: AuthStep;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; needs2fa: boolean; error?: string }>;
  verify2fa: (code: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const TOKEN_KEY = "ap_token";
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>("idle");
  const [loading, setLoading] = useState(true);
  const [tmpToken, setTmpToken] = useState<string>("");

  // Восстанавливаем сессию при загрузке
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    api.me(token).then(({ status, data }) => {
      if (status === 200 && data.user) {
        setUser(data.user as AuthUser);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      setLoading(false);
    }).catch(() => { localStorage.removeItem(TOKEN_KEY); setLoading(false); });
  }, []);

  const login = async (email: string, password: string) => {
    const { status, data } = await api.login(email, password);
    if (status === 403) return { ok: false, needs2fa: false, error: data.error };
    if (status !== 200) return { ok: false, needs2fa: false, error: data.error || "Ошибка входа" };

    if (data.needs2fa) {
      setTmpToken(data.tmp_token);
      setAuthStep("2fa");
      return { ok: true, needs2fa: true };
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user as AuthUser);
    return { ok: true, needs2fa: false };
  };

  const verify2fa = async (code: string) => {
    const { status, data } = await api.verify2fa(tmpToken, code);
    if (status !== 200) return { ok: false, error: data.error || "Неверный код" };

    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user as AuthUser);
    setTmpToken("");
    setAuthStep("idle");
    return { ok: true };
  };

  const register = async (name: string, email: string, password: string) => {
    const { status, data } = await api.register(name, email, password);
    if (status === 201) return { ok: true };
    return { ok: false, error: data.error || "Ошибка регистрации" };
  };

  const logout = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) api.logout(token);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setTmpToken("");
    setAuthStep("idle");
  };

  return (
    <AuthContext.Provider value={{ user, authStep, loading, login, verify2fa, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
