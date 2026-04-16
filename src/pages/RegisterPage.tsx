import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

type Props = { onGoLogin: () => void };

export default function RegisterPage({ onGoLogin }: Props) {
  const { register } = useAuth();
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Слабый", "Средний", "Хороший", "Надёжный"][strength];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Заполните все обязательные поля"); return; }
    if (form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
    if (form.password.length < 6) { setError("Пароль должен содержать минимум 6 символов"); return; }
    if (!agree) { setError("Необходимо принять условия использования"); return; }
    setLoading(true);
    const res = await register(form.name, form.email, form.password);
    setLoading(false);
    if (!res.ok) { setError(res.error || "Ошибка регистрации"); return; }
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Icon name="CheckCircle" size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Аккаунт создан!</h2>
          <p className="text-muted-foreground text-sm mb-2">
            На адрес <span className="font-semibold text-foreground">{form.email}</span> отправлено письмо с подтверждением.
          </p>
          <p className="text-muted-foreground text-sm mb-8">Перейдите по ссылке в письме для активации аккаунта.</p>
          <button
            onClick={onGoLogin}
            className="h-11 px-8 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors"
          >
            Перейти к входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-foreground p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-8 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon name="Zap" size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">AdminPanel</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Присоединяйтесь<br />к системе
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Создайте аккаунт и получите доступ к инструментам управления.
          </p>
          <div className="space-y-4">
            {[
              { step: "1", text: "Заполните форму регистрации" },
              { step: "2", text: "Подтвердите email-адрес" },
              { step: "3", text: "Войдите в систему" },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{s.step}</span>
                </div>
                <span className="text-white/75 text-sm">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/40 text-xs">
          © 2026 AdminPanel. Все права защищены.
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-[400px] animate-slide-up py-4">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Zap" size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">Admin<span className="text-primary">Panel</span></span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground">Создать аккаунт</h1>
            <p className="text-muted-foreground text-sm mt-1">Заполните форму для регистрации</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Полное имя <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Иван Иванов"
                  className="w-full h-11 pl-10 pr-4 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all placeholder:text-muted-foreground"
                />
                <Icon name="User" size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="your@email.ru"
                  className="w-full h-11 pl-10 pr-4 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all placeholder:text-muted-foreground"
                />
                <Icon name="Mail" size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Пароль <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Минимум 6 символов"
                  className="w-full h-11 pl-10 pr-10 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all placeholder:text-muted-foreground"
                />
                <Icon name="Lock" size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : "bg-border"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${["", "text-red-500", "text-orange-500", "text-yellow-600", "text-green-600"][strength]}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Подтвердите пароль <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="Повторите пароль"
                  className={`w-full h-11 pl-10 pr-10 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 bg-white transition-all placeholder:text-muted-foreground ${
                    form.confirm && form.confirm !== form.password ? "border-red-300 focus:border-red-400" : "border-border focus:border-primary"
                  }`}
                />
                <Icon name="Lock" size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                {form.confirm && (
                  <div className="absolute right-3 top-3">
                    <Icon
                      name={form.confirm === form.password ? "CheckCircle" : "XCircle"}
                      size={16}
                      className={form.confirm === form.password ? "text-green-500" : "text-red-400"}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Agree */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <div
                onClick={() => setAgree(!agree)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  agree ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {agree && <Icon name="Check" size={10} className="text-white" />}
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                Я принимаю{" "}
                <button type="button" className="text-primary hover:underline font-medium">условия использования</button>
                {" "}и{" "}
                <button type="button" className="text-primary hover:underline font-medium">политику конфиденциальности</button>
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <Icon name="AlertCircle" size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Создаём аккаунт...
                </>
              ) : (
                <>
                  <Icon name="UserPlus" size={16} />
                  Зарегистрироваться
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Уже есть аккаунт?{" "}
            <button onClick={onGoLogin} className="text-primary font-semibold hover:underline">
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
