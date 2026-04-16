import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

export default function TwoFactorPage() {
  const { verify2fa, logout } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    setError("");
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d) && val) {
      submitCode(next.join(""));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    pasted.split("").forEach((d, i) => { if (i < 6) next[i] = d; });
    setCode(next);
    if (pasted.length === 6) submitCode(pasted);
    else refs.current[pasted.length]?.focus();
  };

  const submitCode = async (fullCode: string) => {
    setError("");
    setLoading(true);
    const res = await verify2fa(fullCode);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Неверный код");
      setCode(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    setResent(true);
    setCountdown(60);
    setCode(["", "", "", "", "", ""]);
    setError("");
    refs.current[0]?.focus();
  };

  const filled = code.filter(Boolean).length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md animate-slide-up">
        {/* Back */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <Icon name="ArrowLeft" size={16} />
          Вернуться к входу
        </button>

        <div className="bg-white rounded-2xl border border-border p-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon name="Smartphone" size={30} className="text-primary" />
          </div>

          <h1 className="text-xl font-bold text-foreground text-center mb-2">
            Двухфакторная аутентификация
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
            Введите 6-значный код из вашего приложения-аутентификатора (Google Authenticator, Authy и др.)
          </p>

          {/* Demo hint */}
          <div className="mb-6 p-3 bg-primary/8 border border-primary/20 rounded-xl text-center">
            <p className="text-xs text-muted-foreground">Тестовый код:</p>
            <p className="text-sm font-bold font-mono text-primary tracking-widest mt-0.5">1 2 3 4 5 6</p>
          </div>

          {/* Code input */}
          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                  ${d ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-foreground"}
                  ${loading ? "opacity-50 pointer-events-none" : ""}
                  focus:border-primary focus:ring-2 focus:ring-primary/20`}
                style={{ height: "52px" }}
                disabled={loading}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {code.map((d, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i < filled ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4">
              <Icon name="AlertCircle" size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => submitCode(code.join(""))}
            disabled={loading || code.some(d => !d)}
            className="w-full h-11 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Проверяем...
              </>
            ) : (
              <>
                <Icon name="ShieldCheck" size={16} />
                Подтвердить
              </>
            )}
          </button>

          {/* Resend */}
          <div className="text-center mt-5">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Отправить повторно через <span className="font-semibold text-foreground">{countdown}с</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-primary font-medium hover:underline"
              >
                {resent ? "Отправить ещё раз" : "Не пришёл код? Отправить снова"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-xl border border-border">
          <div className="flex items-start gap-3">
            <Icon name="HelpCircle" size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Нет доступа к приложению? Используйте резервный код или обратитесь к администратору системы.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
