import { useState } from "react";
import Icon from "@/components/ui/icon";

type Role = "Все" | "Администратор" | "Менеджер" | "Модератор" | "Пользователь";
type Status = "active" | "blocked" | "inactive";

interface User {
  id: number;
  name: string;
  email: string;
  role: Exclude<Role, "Все">;
  status: Status;
  twofa: boolean;
  lastSeen: string;
  avatar: string;
}

const initialUsers: User[] = [
  { id: 1, name: "Алексей Петров", email: "a.petrov@mail.ru", role: "Администратор", status: "active", twofa: true, lastSeen: "Сейчас", avatar: "АП" },
  { id: 2, name: "Мария Иванова", email: "m.ivanova@mail.ru", role: "Менеджер", status: "active", twofa: true, lastSeen: "5 мин назад", avatar: "МИ" },
  { id: 3, name: "Дмитрий Сидоров", email: "d.sidorov@mail.ru", role: "Модератор", status: "active", twofa: false, lastSeen: "1 час назад", avatar: "ДС" },
  { id: 4, name: "Анна Козлова", email: "a.kozlova@mail.ru", role: "Пользователь", status: "inactive", twofa: false, lastSeen: "3 дня назад", avatar: "АК" },
  { id: 5, name: "Сергей Новиков", email: "s.novikov@mail.ru", role: "Пользователь", status: "blocked", twofa: false, lastSeen: "12 дней назад", avatar: "СН" },
  { id: 6, name: "Елена Фёдорова", email: "e.fedorova@mail.ru", role: "Менеджер", status: "active", twofa: true, lastSeen: "20 мин назад", avatar: "ЕФ" },
  { id: 7, name: "Павел Михайлов", email: "p.mikhailov@mail.ru", role: "Пользователь", status: "active", twofa: false, lastSeen: "2 часа назад", avatar: "ПМ" },
  { id: 8, name: "Ольга Смирнова", email: "o.smirnova@mail.ru", role: "Модератор", status: "blocked", twofa: true, lastSeen: "7 дней назад", avatar: "ОС" },
];

const roleColors: Record<string, string> = {
  "Администратор": "bg-primary/10 text-primary",
  "Менеджер": "bg-violet-100 text-violet-700",
  "Модератор": "bg-orange-100 text-orange-700",
  "Пользователь": "bg-gray-100 text-gray-600",
};

const statusConfig: Record<Status, { label: string; cls: string }> = {
  active: { label: "Активен", cls: "bg-green-100 text-green-700" },
  blocked: { label: "Заблокирован", cls: "bg-red-100 text-red-700" },
  inactive: { label: "Неактивен", cls: "bg-gray-100 text-gray-600" },
};

const roles: Role[] = ["Все", "Администратор", "Менеджер", "Модератор", "Пользователь"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filterRole, setFilterRole] = useState<Role>("Все");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = users.filter(u => {
    const matchRole = filterRole === "Все" || u.role === filterRole;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const toggleBlock = (id: number) => {
    setUsers(prev => prev.map(u =>
      u.id === id
        ? { ...u, status: u.status === "blocked" ? "active" : "blocked" }
        : u
    ));
  };

  const toggleSelect = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Пользователи</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} аккаунтов в системе</p>
        </div>
        <button className="h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Icon name="UserPlus" size={15} />
          Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          <Icon name="Search" size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
        </div>
        <div className="flex gap-1.5">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`h-9 px-3 text-xs font-medium rounded-lg transition-colors ${
                filterRole === r
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button className="h-9 px-3 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-2">
          <Icon name="Filter" size={14} />
          Фильтры
        </button>
        <button className="h-9 px-3 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-2">
          <Icon name="Download" size={14} />
          Экспорт
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded"
                  onChange={e => setSelected(e.target.checked ? filtered.map(u => u.id) : [])}
                  checked={selected.length === filtered.length && filtered.length > 0}
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Пользователь</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Роль</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Статус</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">2FA</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Последний вход</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr
                key={u.id}
                className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                  selected.includes(u.id) ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selected.includes(u.id)}
                    onChange={() => toggleSelect(u.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{u.avatar}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge-role ${roleColors[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge-role ${statusConfig[u.status].cls}`}>
                    {statusConfig[u.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.twofa ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                      <Icon name="ShieldCheck" size={14} />
                      Включено
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Icon name="ShieldOff" size={14} />
                      Выключено
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastSeen}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBlock(u.id)}
                      title={u.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        u.status === "blocked"
                          ? "text-green-600 hover:bg-green-50"
                          : "text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <Icon name={u.status === "blocked" ? "Unlock" : "Lock"} size={14} />
                    </button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                      <Icon name="MoreHorizontal" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Icon name="SearchX" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Пользователи не найдены</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Показано {filtered.length} из {users.length}</span>
        <div className="flex gap-1">
          {[1, 2, 3].map(p => (
            <button
              key={p}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === 1 ? "bg-primary text-white" : "border border-border hover:bg-secondary"
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
