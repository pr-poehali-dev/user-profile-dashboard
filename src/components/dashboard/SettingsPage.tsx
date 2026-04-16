import { useState } from "react";
import Icon from "@/components/ui/icon";

export default function SettingsPage() {
  const [twoFA, setTwoFA] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [loginAlert, setLoginAlert] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [tab, setTab] = useState<"account" | "security" | "notifications" | "backup">("account");

  const tabs = [
    { id: "account", label: "Аккаунт", icon: "User" },
    { id: "security", label: "Безопасность", icon: "Shield" },
    { id: "notifications", label: "Уведомления", icon: "Bell" },
    { id: "backup", label: "Резервные копии", icon: "DatabaseBackup" },
  ] as const;

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? "bg-primary" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? "translate-x-5" : ""}`} />
    </button>
  );

  const Row = ({ icon, label, desc, right }: { icon: string; label: string; desc?: string; right: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <Icon name={icon} size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      </div>
      {right}
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Настройки</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Управление параметрами аккаунта и системы</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 h-8 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
              tab === t.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-border p-5">
        {tab === "account" && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Параметры аккаунта</h3>
            <Row icon="User" label="Имя пользователя" desc="Отображается везде в системе"
              right={
                <input defaultValue="aleksey.petrov" className="w-44 h-8 px-3 text-sm bg-secondary rounded-lg outline-none focus:ring-1 focus:ring-primary/40" />
              }
            />
            <Row icon="Mail" label="Email адрес" desc="a.petrov@company.ru"
              right={
                <button className="h-8 px-3 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                  Изменить
                </button>
              }
            />
            <Row icon="Globe" label="Язык интерфейса"
              right={
                <select className="h-8 px-3 text-sm bg-secondary rounded-lg outline-none focus:ring-1 focus:ring-primary/40 border-0">
                  <option>Русский</option>
                  <option>English</option>
                </select>
              }
            />
            <Row icon="Clock" label="Часовой пояс"
              right={
                <select className="h-8 px-3 text-sm bg-secondary rounded-lg outline-none focus:ring-1 focus:ring-primary/40 border-0">
                  <option>UTC+3 Москва</option>
                  <option>UTC+0</option>
                </select>
              }
            />
            <div className="mt-5 flex gap-3">
              <button className="h-9 px-5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                Сохранить
              </button>
              <button className="h-9 px-5 bg-secondary text-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Безопасность</h3>
            <Row icon="Smartphone" label="Двухфакторная аутентификация" desc="Используйте приложение-аутентификатор для подтверждения входа"
              right={<Toggle value={twoFA} onChange={() => setTwoFA(!twoFA)} />}
            />
            <Row icon="Timer" label="Тайм-аут сессии" desc="Автоматический выход при бездействии"
              right={
                <select
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(e.target.value)}
                  className="h-8 px-3 text-sm bg-secondary rounded-lg outline-none border-0"
                >
                  <option value="15">15 минут</option>
                  <option value="30">30 минут</option>
                  <option value="60">1 час</option>
                  <option value="480">8 часов</option>
                </select>
              }
            />
            <Row icon="Lock" label="Смена пароля" desc="Последнее изменение: 45 дней назад"
              right={
                <button className="h-8 px-3 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                  Сменить
                </button>
              }
            />
            <Row icon="Monitor" label="Активные сессии" desc="2 устройства авторизованы"
              right={
                <button className="h-8 px-3 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Завершить все
                </button>
              }
            />
            {twoFA && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="ShieldCheck" size={16} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-800">2FA подключена</p>
                </div>
                <p className="text-xs text-green-700">
                  Ваш аккаунт защищён двухфакторной аутентификацией. При каждом входе требуется подтверждение через приложение.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "notifications" && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Уведомления</h3>
            <Row icon="Mail" label="Email-уведомления" desc="Получать важные уведомления на почту"
              right={<Toggle value={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />}
            />
            <Row icon="Bell" label="Push-уведомления" desc="Уведомления в браузере"
              right={<Toggle value={pushNotif} onChange={() => setPushNotif(!pushNotif)} />}
            />
            <Row icon="LogIn" label="Оповещения о входе" desc="Уведомлять при каждом новом входе в аккаунт"
              right={<Toggle value={loginAlert} onChange={() => setLoginAlert(!loginAlert)} />}
            />

            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">Типы событий</p>
              <div className="space-y-2">
                {[
                  "Добавление нового пользователя",
                  "Блокировка аккаунта",
                  "Изменение роли пользователя",
                  "Подозрительная активность",
                  "Создание резервной копии",
                ].map(ev => (
                  <label key={ev} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-foreground">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "backup" && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Резервные копии</h3>
            <Row icon="RefreshCw" label="Автоматическое резервирование" desc="Создавать копию каждые 24 часа"
              right={<Toggle value={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />}
            />

            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-3">История резервных копий</p>
              <div className="space-y-2">
                {[
                  { date: "15 апр. 2026, 03:00", size: "2.4 МБ", status: "ok" },
                  { date: "14 апр. 2026, 03:00", size: "2.3 МБ", status: "ok" },
                  { date: "13 апр. 2026, 03:00", size: "2.3 МБ", status: "ok" },
                  { date: "12 апр. 2026, 03:00", size: "2.2 МБ", status: "error" },
                ].map(b => (
                  <div key={b.date} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${b.status === "ok" ? "bg-green-500" : "bg-red-500"}`} />
                      <p className="text-sm text-foreground">{b.date}</p>
                      <p className="text-xs text-muted-foreground">{b.size}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="h-7 px-2.5 text-xs font-medium border border-border rounded-lg hover:bg-white transition-colors text-muted-foreground flex items-center gap-1">
                        <Icon name="Download" size={11} />
                        Скачать
                      </button>
                      <button className="h-7 px-2.5 text-xs font-medium border border-border rounded-lg hover:bg-white transition-colors text-muted-foreground flex items-center gap-1">
                        <Icon name="RotateCcw" size={11} />
                        Восстановить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="mt-4 h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Icon name="Save" size={15} />
              Создать копию сейчас
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
