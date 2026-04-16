import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";

type Role = "Все" | "Администратор" | "Менеджер" | "Модератор" | "Пользователь";
type Status = "active" | "blocked" | "inactive";

interface User {
  id: number;
  name: string;
  email: string;
  role: Exclude<Role, "Все">;
  status: Status;
  twofa: boolean;
  avatar: string;
  last_login: string | null;
  created_at: string;
}

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
const roleOptions = ["Администратор", "Менеджер", "Модератор", "Пользователь"];

function formatDate(iso: string | null) {
  if (!iso) return "Никогда";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

// ── Модалка добавления / редактирования ──────────────────────────────────────
function UserModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial?: Partial<User>;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initial?.role || "Пользователь");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let res;
    if (mode === "create") {
      if (!password) { setError("Введите пароль"); setLoading(false); return; }
      res = await api.createUser(name, email, password, role);
      if (res.status === 201) { onSave(); onClose(); return; }
    } else {
      res = await api.updateUser(initial!.id!, name, email);
      if (res.status === 200) {
        if (role !== initial?.role) await api.updateRole(initial!.id!, role);
        onSave(); onClose(); return;
      }
    }
    setError(res.data?.error || "Ошибка сохранения");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-xl p-6 animate-scale-in mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-foreground">
            {mode === "create" ? "Новый пользователь" : "Редактировать пользователя"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Полное имя</label>
            <div className="relative">
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Иван Иванов"
                className="w-full h-10 pl-9 pr-3 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white" />
              <Icon name="User" size={14} className="absolute left-3 top-3 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@mail.ru"
                className="w-full h-10 pl-9 pr-3 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white" />
              <Icon name="Mail" size={14} className="absolute left-3 top-3 text-muted-foreground" />
            </div>
          </div>
          {mode === "create" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Пароль</label>
              <div className="relative">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Минимум 6 символов"
                  className="w-full h-10 pl-9 pr-3 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white" />
                <Icon name="Lock" size={14} className="absolute left-3 top-3 text-muted-foreground" />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Роль</label>
            <select value={role} onChange={e => setRole(e.target.value as typeof role)}
              className="w-full h-10 px-3 text-sm border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
              {roleOptions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <Icon name="AlertCircle" size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 bg-secondary text-foreground text-sm font-semibold rounded-xl hover:bg-secondary/80 transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {mode === "create" ? "Создать" : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Основная страница ─────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<Role>("Все");
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [modal, setModal] = useState<null | "create" | { edit: User }>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [roleDropdown, setRoleDropdown] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingList(true);
    const params: Record<string, string> = {};
    if (filterRole !== "Все") params.role = filterRole;
    if (search) params.search = search;
    const { data } = await api.getUsers(params);
    setUsers(data.users || []);
    setLoadingList(false);
  }, [filterRole, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleToggleBlock = async (user: User) => {
    setTogglingId(user.id);
    const { status, data } = await api.toggleBlock(user.id);
    if (status === 200) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: data.new_status } : u));
    }
    setTogglingId(null);
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    setRoleDropdown(null);
    if (newRole === user.role) return;
    const { status } = await api.updateRole(user.id, newRole);
    if (status === 200) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole as User["role"] } : u));
    }
  };

  const toggleSelect = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const activeCount = users.filter(u => u.status === "active").length;
  const blockedCount = users.filter(u => u.status === "blocked").length;
  const twoFaCount = users.filter(u => u.twofa).length;

  return (
    <div className="space-y-5">
      {/* Модалки */}
      {modal === "create" && (
        <UserModal mode="create" onClose={() => setModal(null)} onSave={fetchUsers} />
      )}
      {modal && typeof modal === "object" && "edit" in modal && (
        <UserModal mode="edit" initial={modal.edit} onClose={() => setModal(null)} onSave={fetchUsers} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Пользователи</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} аккаунтов в системе</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Icon name="UserPlus" size={15} />
          Добавить
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Активных", value: activeCount, color: "text-green-600 bg-green-50", icon: "UserCheck" },
          { label: "Заблокировано", value: blockedCount, color: "text-red-500 bg-red-50", icon: "UserX" },
          { label: "Защищено 2FA", value: twoFaCount, color: "text-primary bg-primary/10", icon: "ShieldCheck" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              <Icon name={s.icon} size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
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
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {roles.map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              className={`h-9 px-3 text-xs font-medium rounded-lg transition-colors ${
                filterRole === r ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={fetchUsers} className="h-9 px-3 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-2">
          <Icon name="RefreshCw" size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loadingList ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm">Загружаем пользователей...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="rounded"
                    onChange={e => setSelected(e.target.checked ? users.map(u => u.id) : [])}
                    checked={selected.length === users.length && users.length > 0} />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Пользователь</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Роль</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Статус</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">2FA</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Последний вход</th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}
                  className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${selected.includes(u.id) ? "bg-primary/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{u.avatar || u.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setRoleDropdown(roleDropdown === u.id ? null : u.id)}
                      className={`badge-role ${roleColors[u.role]} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                    >
                      {u.role}
                      <Icon name="ChevronDown" size={10} />
                    </button>
                    {roleDropdown === u.id && (
                      <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-border rounded-xl shadow-lg py-1 min-w-36 animate-scale-in">
                        {roleOptions.map(r => (
                          <button key={r} onClick={() => handleRoleChange(u, r)}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors ${r === u.role ? "font-bold text-primary" : "text-foreground"}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge-role ${statusConfig[u.status]?.cls || statusConfig.inactive.cls}`}>
                      {statusConfig[u.status]?.label || "Неактивен"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.twofa ? (
                      <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                        <Icon name="ShieldCheck" size={14} /> Включено
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Icon name="ShieldOff" size={14} /> Выключено
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.last_login)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleBlock(u)}
                        disabled={togglingId === u.id}
                        title={u.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${
                          u.status === "blocked" ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"
                        }`}
                      >
                        {togglingId === u.id
                          ? <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          : <Icon name={u.status === "blocked" ? "Unlock" : "Lock"} size={14} />
                        }
                      </button>
                      <button
                        onClick={() => setModal({ edit: u })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                      >
                        <Icon name="Pencil" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loadingList && users.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Icon name="SearchX" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Пользователи не найдены</p>
            {search && <button onClick={() => setSearch("")} className="mt-2 text-xs text-primary hover:underline">Сбросить поиск</button>}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loadingList && users.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selected.length > 0
              ? `Выбрано: ${selected.length} из ${users.length}`
              : `Всего: ${users.length} пользователей`}
          </span>
          {selected.length > 0 && (
            <button onClick={() => setSelected([])} className="text-xs text-primary hover:underline">
              Снять выделение
            </button>
          )}
        </div>
      )}

      {/* Overlay для закрытия дропдауна */}
      {roleDropdown !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setRoleDropdown(null)} />
      )}
    </div>
  );
}
