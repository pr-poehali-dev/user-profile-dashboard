import { useState } from "react";
import Icon from "@/components/ui/icon";

const permissions = [
  { label: "Просмотр пользователей", granted: true },
  { label: "Редактирование пользователей", granted: true },
  { label: "Блокировка аккаунтов", granted: true },
  { label: "Управление ролями", granted: true },
  { label: "Просмотр статистики", granted: true },
  { label: "Экспорт данных", granted: true },
  { label: "Резервное копирование", granted: true },
  { label: "Системные настройки", granted: true },
];

export default function ProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "Алексей Петров",
    email: "a.petrov@company.ru",
    phone: "+7 (999) 123-45-67",
    position: "Системный администратор",
    department: "Отдел IT",
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">АП</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <Icon name="Check" size={10} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{form.name}</h2>
              <p className="text-sm text-muted-foreground">{form.position} · {form.department}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-role bg-primary/10 text-primary">Администратор</span>
                <span className="badge-role bg-green-100 text-green-700 flex items-center gap-1">
                  <Icon name="ShieldCheck" size={11} />
                  2FA активна
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`h-9 px-4 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              editMode
                ? "bg-secondary text-foreground"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            <Icon name={editMode ? "X" : "Pencil"} size={14} />
            {editMode ? "Отмена" : "Редактировать"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          {[
            { label: "Аккаунт создан", value: "12 янв. 2024" },
            { label: "Последний вход", value: "Сегодня, 09:14" },
            { label: "Действий за месяц", value: "284" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal info */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="User" size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground">Личная информация</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Полное имя", key: "name", icon: "User" },
              { label: "Email", key: "email", icon: "Mail" },
              { label: "Телефон", key: "phone", icon: "Phone" },
              { label: "Должность", key: "position", icon: "Briefcase" },
              { label: "Отдел", key: "department", icon: "Building2" },
            ].map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon name={field.icon} size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  {editMode ? (
                    <input
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full text-sm font-medium text-foreground bg-secondary rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary/40 mt-0.5"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground truncate">{form[field.key as keyof typeof form]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {editMode && (
            <button className="w-full mt-4 h-9 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              Сохранить изменения
            </button>
          )}
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Key" size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground">Права доступа</h3>
          </div>
          <div className="space-y-2">
            {permissions.map(p => (
              <div key={p.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <p className="text-sm text-foreground">{p.label}</p>
                <span className={`flex items-center gap-1 text-xs font-medium ${
                  p.granted ? "text-green-600" : "text-muted-foreground"
                }`}>
                  <Icon name={p.granted ? "CheckCircle" : "XCircle"} size={14} />
                  {p.granted ? "Разрешено" : "Запрещено"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Shield" size={16} className="text-primary" />
          <h3 className="font-semibold text-foreground">Безопасность аккаунта</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "Lock",
              title: "Пароль",
              desc: "Последнее изменение: 45 дней назад",
              action: "Сменить пароль",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: "Smartphone",
              title: "2FA аутентификация",
              desc: "Подключено через приложение",
              action: "Управление",
              color: "text-green-600",
              bg: "bg-green-100",
            },
            {
              icon: "Monitor",
              title: "Активные сессии",
              desc: "2 устройства онлайн",
              action: "Завершить все",
              color: "text-orange-600",
              bg: "bg-orange-100",
            },
          ].map(s => (
            <div key={s.title} className="flex flex-col p-4 rounded-xl bg-secondary/50 border border-border">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon name={s.icon} size={16} className={s.color} />
              </div>
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-1 flex-1">{s.desc}</p>
              <button className="mt-3 text-xs font-semibold text-primary hover:underline text-left">{s.action}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
