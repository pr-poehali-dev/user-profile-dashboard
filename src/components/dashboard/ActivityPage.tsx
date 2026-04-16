import { useState } from "react";
import Icon from "@/components/ui/icon";

type EventType = "all" | "auth" | "users" | "system" | "security";

const events = [
  { id: 1, type: "auth", icon: "LogIn", color: "text-green-600 bg-green-50", user: "Алексей Петров", action: "Вход в систему", detail: "IP: 192.168.1.10", time: "09:14:32", date: "Сегодня" },
  { id: 2, type: "users", icon: "UserPlus", color: "text-primary bg-primary/10", user: "Алексей Петров", action: "Добавлен новый пользователь", detail: "Создан аккаунт: o.smirnova@mail.ru", time: "09:02:11", date: "Сегодня" },
  { id: 3, type: "security", icon: "Lock", color: "text-red-500 bg-red-50", user: "Алексей Петров", action: "Аккаунт заблокирован", detail: "Пользователь: Сергей Новиков", time: "08:45:00", date: "Сегодня" },
  { id: 4, type: "system", icon: "Save", color: "text-teal-600 bg-teal-50", user: "Система", action: "Резервная копия создана", detail: "Размер: 2.4 МБ", time: "03:00:00", date: "Сегодня" },
  { id: 5, type: "users", icon: "Pencil", color: "text-violet-600 bg-violet-50", user: "Мария Иванова", action: "Роль изменена", detail: "Пользователь → Менеджер: Елена Фёдорова", time: "18:30:12", date: "Вчера" },
  { id: 6, type: "auth", icon: "ShieldAlert", color: "text-orange-600 bg-orange-50", user: "Система", action: "Подозрительная активность", detail: "Множественные неудачные попытки входа", time: "17:22:05", date: "Вчера" },
  { id: 7, type: "auth", icon: "LogOut", color: "text-gray-500 bg-gray-100", user: "Дмитрий Сидоров", action: "Выход из системы", detail: "Сессия завершена", time: "16:00:00", date: "Вчера" },
  { id: 8, type: "security", icon: "Key", color: "text-primary bg-primary/10", user: "Мария Иванова", action: "Включена 2FA", detail: "Двухфакторная аутентификация активирована", time: "14:10:33", date: "Вчера" },
  { id: 9, type: "system", icon: "Settings", color: "text-teal-600 bg-teal-50", user: "Алексей Петров", action: "Изменены системные настройки", detail: "Тайм-аут сессии: 30 → 60 мин", time: "11:55:20", date: "14 апр." },
  { id: 10, type: "users", icon: "Unlock", color: "text-green-600 bg-green-50", user: "Алексей Петров", action: "Аккаунт разблокирован", detail: "Пользователь: Анна Козлова", time: "10:20:00", date: "14 апр." },
];

const typeConfig = {
  all: { label: "Все события", icon: "List" },
  auth: { label: "Аутентификация", icon: "LogIn" },
  users: { label: "Пользователи", icon: "Users" },
  system: { label: "Система", icon: "Cpu" },
  security: { label: "Безопасность", icon: "Shield" },
} as const;

export default function ActivityPage() {
  const [filter, setFilter] = useState<EventType>("all");
  const [search, setSearch] = useState("");

  const filtered = events.filter(e => {
    const matchType = filter === "all" || e.type === filter;
    const matchSearch = e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.user.toLowerCase().includes(search.toLowerCase()) ||
      e.detail.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const grouped = filtered.reduce<Record<string, typeof events>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">История действий</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Аудит всех событий в системе</p>
        </div>
        <button className="h-9 px-4 border border-border rounded-lg text-sm text-muted-foreground hover:bg-white transition-colors flex items-center gap-2">
          <Icon name="Download" size={14} />
          Экспорт журнала
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по событиям..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          <Icon name="Search" size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(typeConfig) as EventType[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`h-9 px-3 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                filter === t
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={typeConfig[t].icon} size={13} />
              {typeConfig[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Всего сегодня", value: events.filter(e => e.date === "Сегодня").length, icon: "Activity", color: "text-primary" },
          { label: "Входов в систему", value: events.filter(e => e.type === "auth").length, icon: "LogIn", color: "text-green-600" },
          { label: "Изменений пользователей", value: events.filter(e => e.type === "users").length, icon: "Users", color: "text-violet-600" },
          { label: "Событий безопасности", value: events.filter(e => e.type === "security").length, icon: "ShieldAlert", color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Icon name={s.icon} size={16} className={s.color} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {Object.keys(grouped).length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Icon name="SearchX" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">События не найдены</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="px-5 py-2.5 bg-secondary/50 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{date}</p>
              </div>
              <div className="divide-y divide-border">
                {items.map(e => (
                  <div key={e.id} className="px-5 py-3.5 flex items-start gap-4 hover:bg-secondary/20 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${e.color}`}>
                      <Icon name={e.icon} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{e.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-mono text-muted-foreground">{e.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-primary">{e.user.slice(0,1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{e.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Показано {filtered.length} событий</span>
        <div className="flex gap-1">
          {[1, 2, 3, "..."].map((p, i) => (
            <button
              key={i}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                p === 1 ? "bg-primary text-white" : "border border-border hover:bg-secondary text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
