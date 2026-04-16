import { createContext, useContext, useState, ReactNode } from "react";

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
  login: (email: string, password: string) => Promise<{ ok: boolean; needs2fa: boolean; error?: string }>;
  verify2fa: (code: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const MOCK_USERS = [
  { id: 1, name: "Алексей Петров", email: "admin@mail.ru", password: "admin123", role: "Администратор" as const, twofa: true, avatar: "АП" },
  { id: 2, name: "Мария Иванова", email: "user@mail.ru", password: "user123", role: "Менеджер" as const, twofa: false, avatar: "МИ" },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>("idle");
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 800));
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) return { ok: false, needs2fa: false, error: "Неверный email или пароль" };
    const authUser: AuthUser = { id: found.id, name: found.name, email: found.email, role: found.role, twofa: found.twofa, avatar: found.avatar };
    if (found.twofa) {
      setPendingUser(authUser);
      setAuthStep("2fa");
      return { ok: true, needs2fa: true };
    }
    setUser(authUser);
    return { ok: true, needs2fa: false };
  };

  const verify2fa = async (code: string) => {
    await new Promise(r => setTimeout(r, 600));
    if (code === "123456") {
      setUser(pendingUser);
      setPendingUser(null);
      setAuthStep("idle");
      return { ok: true };
    }
    return { ok: false, error: "Неверный код. Попробуйте ещё раз" };
  };

  const register = async (name: string, email: string, password: string) => {
    await new Promise(r => setTimeout(r, 900));
    if (MOCK_USERS.find(u => u.email === email)) {
      return { ok: false, error: "Пользователь с таким email уже существует" };
    }
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    setPendingUser(null);
    setAuthStep("idle");
  };

  return (
    <AuthContext.Provider value={{ user, authStep, login, verify2fa, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
