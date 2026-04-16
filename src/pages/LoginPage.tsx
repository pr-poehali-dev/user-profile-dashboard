import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

type Props = {
  onGoRegister: () => void;
  onGoForgot: () => void;
};

export default function LoginPage({ onGoRegister, onGoForgot }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Заполните все поля"); return; }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) setError(res.error || "Ошибка входа");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-primary p-12 relative overflow-hidden flex-shrink-0">
        {/* Декоративные круги */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-8 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon name="Zap" size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">AdminPanel</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Управляйте системой<br />с удобством
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Полный контроль над пользователями, безопасностью и данными вашей организации в одном месте.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { icon: "Users", text: "Гибкая система ролей и прав доступа" },
              { icon: "ShieldCheck", text: "Двухфакторная аутентификация" },
              { icon: "Activity", text: "История всех действий в системе" },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon name={f.icon} size={14} className="text-white" />
                </div>
                <span className="text-white/80 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white">АП</span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Алексей Петров</p>
                <p className="text-white/60 text-xs">Администратор</p>
              </div>
            </div>
            <p className="text-white/70 text-xs leading-relaxed italic">
              "Удобная панель управления. Всё под рукой, ничего лишнего."
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Zap" size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">Admin<span className="text-primary">Panel</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Добро пожаловать</h1>
            <p className="text-muted-foreground text-sm mt-1">Войдите в свой аккаунт, чтобы продолжить</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.ru"
                  className="w-full h-11 pl-10 pr-4 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all placeholder:text-muted-foreground"
                />
                <Icon name="Mail" size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Пароль</label>
                <button type="button" onClick={onGoForgot} className="text-xs text-primary hover:underline font-medium">
                  Забыли пароль?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all placeholder:text-muted-foreground"
                />
                <Icon name="Lock" size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setRemember(!remember)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  remember ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {remember && <Icon name="Check" size={10} className="text-white" />}
              </div>
              <span className="text-sm text-foreground">Запомнить меня</span>
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <Icon name="AlertCircle" size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Входим...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={16} />
                  Войти
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Нет аккаунта?{" "}
            <button onClick={onGoRegister} className="text-primary font-semibold hover:underline">
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}