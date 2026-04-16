import Icon from "@/components/ui/icon";

const features = [
  {
    icon: "LayoutDashboard",
    title: "Дашборд статистики",
    desc: "Метрики активности, новые пользователи, рост системы и ключевые показатели в реальном времени.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: "Users",
    title: "Управление пользователями",
    desc: "Гибкая система ролей и прав доступа. Блокировка, деактивация, назначение привилегий.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: "ShieldCheck",
    title: "Двухфакторная аутентификация",
    desc: "Повышенная безопасность аккаунтов с поддержкой 2FA через приложения-аутентификаторы.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: "Activity",
    title: "История действий",
    desc: "Детальное логирование всех операций в системе. Отслеживание изменений и аудит безопасности.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: "Settings",
    title: "Настройки аккаунта",
    desc: "Персонализация профиля, смена пароля, управление уведомлениями и параметрами безопасности.",
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: "DatabaseBackup",
    title: "Резервное копирование",
    desc: "Создание и восстановление резервных копий данных системы с расписанием и историей копий.",
    color: "bg-teal-50 text-teal-600",
  },
];

const stats = [
  { label: "Пользователей", value: "1 284", delta: "+12 за неделю", up: true, icon: "Users" },
  { label: "Активных сессий", value: "347", delta: "+5.2%", up: true, icon: "Wifi" },
  { label: "Событий сегодня", value: "2 891", delta: "-1.4%", up: false, icon: "Activity" },
  { label: "Уровень угроз", value: "Низкий", delta: "Всё в порядке", up: true, icon: "ShieldCheck" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-white rounded-2xl border border-border p-8 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Добро пожаловать в систему</p>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Панель управления <br />
            <span className="text-primary">AdminPanel</span>
          </h2>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Централизованное управление пользователями, безопасностью и данными. Все инструменты администратора в одном месте.
          </p>
          <div className="flex gap-3 mt-6">
            <button className="h-9 px-5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              Перейти к дашборду
            </button>
            <button className="h-9 px-5 bg-secondary text-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80 transition-colors">
              Управление пользователями
            </button>
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-center w-48 h-48 relative">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon name="Zap" size={36} className="text-primary" />
            </div>
          </div>
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Icon name="ShieldCheck" size={18} className="text-green-600" />
          </div>
          <div className="absolute bottom-4 left-4 w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Icon name="Users" size={18} className="text-violet-600" />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name={s.icon} size={15} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${s.up ? "text-green-600" : "text-red-500"}`}>
              <Icon name={s.up ? "TrendingUp" : "TrendingDown"} size={12} />
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Features grid */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">Возможности системы</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <Icon name={f.icon} size={18} />
              </div>
              <h4 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
