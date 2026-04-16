import { useState } from "react";
import Icon from "@/components/ui/icon";

type Props = { onGoLogin: () => void };

export default function ForgotPasswordPage({ onGoLogin }: Props) {
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Введите email адрес"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Введите корректный email"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setStep("sent");
  };

  if (step === "sent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon name="MailCheck" size={38} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Письмо отправлено</h2>
          <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
            Инструкция по восстановлению пароля отправлена на{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </p>
          <p className="text-muted-foreground text-sm mb-8">Проверьте папку «Входящие» и «Спам».</p>
          <div className="space-y-3">
            <button
              onClick={onGoLogin}
              className="w-full h-11 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors"
            >
              Вернуться к входу
            </button>
            <button
              onClick={() => setStep("email")}
              className="w-full h-11 bg-secondary text-foreground font-semibold text-sm rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Отправить повторно
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md animate-slide-up">
        <button
          onClick={onGoLogin}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <Icon name="ArrowLeft" size={16} />
          Вернуться к входу
        </button>

        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Icon name="KeyRound" size={26} className="text-primary" />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2">Восстановление пароля</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Введите email, привязанный к вашему аккаунту. Мы отправим инструкцию по сбросу пароля.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email адрес</label>
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

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <Icon name="AlertCircle" size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Отправляем...
                </>
              ) : (
                <>
                  <Icon name="Send" size={15} />
                  Отправить инструкцию
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
