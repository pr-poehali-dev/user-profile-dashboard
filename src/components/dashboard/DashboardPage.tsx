import { useState } from "react";
import Icon from "@/components/ui/icon";

const periods = ["Сегодня", "Неделя", "Месяц", "Год"];

const metrics = [
  { label: "НОВЫЕ ПОЛЬЗОВАТЕЛИ", value: "3 897", delta: "+3.3%", up: true, icon: "UserPlus", chart: "line" },
  { label: "АКТИВНЫЕ СЕССИИ", value: "35 084", delta: "-2.8%", up: false, icon: "Monitor", chart: "bar" },
  { label: "РОСТ СИСТЕМЫ", value: "89.87%", delta: "+2.8%", up: true, icon: "TrendingUp", chart: "line" },
];

const miniLine = (up: boolean) => (
  <svg viewBox="0 0 80 32" className="w-20 h-8" fill="none">
    <polyline
      points={up
        ? "0,28 12,22 24,25 36,18 48,20 60,12 72,8 80,4"
        : "0,4 12,10 24,6 36,14 48,11 60,18 72,22 80,28"
      }
      stroke={up ? "#4361ee" : "#4361ee"}
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
      opacity="0.8"
    />
  </svg>
);

const miniBar = () => (
  <svg viewBox="0 0 80 32" className="w-20 h-8" fill="none">
    {[4, 10, 7, 14, 10, 18, 12, 22, 16, 20].map((h, i) => (
      <rect
        key={i}
        x={i * 8 + 1}
        y={32 - h}
        width="6"
        height={h}
        rx="1.5"
        fill="#4361ee"
        opacity={0.5 + i * 0.04}
      />
    ))}
  </svg>
);

const revenuePoints = [
  [0,55],[5,52],[10,58],[15,50],[20,54],[25,48],[30,52],[35,45],[40,50],
  [45,44],[50,48],[55,43],[60,47],[65,41],[70,45],[75,40],[80,44],[85,38],[90,42],[95,36],[100,40],
];

const topUsers = [
  { name: "Алексей Петров", role: "Администратор", actions: 284, avatar: "АП" },
  { name: "Мария Иванова", role: "Менеджер", actions: 197, avatar: "МИ" },
  { name: "Дмитрий Сидоров", role: "Модератор", actions: 153, avatar: "ДС" },
  { name: "Анна Козлова", role: "Пользователь", actions: 89, avatar: "АК" },
  { name: "Сергей Новиков", role: "Пользователь", actions: 74, avatar: "СН" },
];

const roleColors: Record<string, string> = {
  "Администратор": "bg-primary/10 text-primary",
  "Менеджер": "bg-violet-100 text-violet-700",
  "Модератор": "bg-orange-100 text-orange-700",
  "Пользователь": "bg-gray-100 text-gray-600",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState("Месяц");

  const pathD = revenuePoints.map((p, i) =>
    (i === 0 ? "M" : "L") + `${p[0] * 8},${p[1] * 3}`
  ).join(" ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Обзор системы</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Ключевые показатели и активность</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 text-sm border border-border rounded-lg flex items-center gap-2 hover:bg-secondary transition-colors text-muted-foreground">
            <Icon name="Calendar" size={14} />
            16 апр. 2026
          </button>
          <button className="h-8 px-3 text-sm border border-border rounded-lg flex items-center gap-2 hover:bg-secondary transition-colors text-muted-foreground">
            <Icon name="Printer" size={14} />
            Печать
          </button>
          <button className="h-8 px-4 text-sm bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors font-medium">
            <Icon name="Download" size={14} />
            Отчёт
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{m.value}</p>
                <p className={`text-xs mt-1.5 font-semibold flex items-center gap-1 ${m.up ? "text-green-600" : "text-red-500"}`}>
                  <Icon name={m.up ? "ArrowUp" : "ArrowDown"} size={11} />
                  {m.delta}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button className="text-muted-foreground hover:text-foreground">
                  <Icon name="MoreHorizontal" size={16} />
                </button>
                {m.chart === "bar" ? miniBar() : miniLine(m.up)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Top users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-sm font-bold text-foreground uppercase tracking-wide">АКТИВНОСТЬ</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Общее количество действий пользователей в системе за период
              </p>
            </div>
            <div className="flex gap-1">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`h-7 px-3 text-xs rounded-lg font-medium transition-colors ${
                    period === p
                      ? "bg-primary text-white"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg bg-secondary/30 p-3">
            <svg viewBox="0 0 820 180" className="w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4361ee" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4361ee" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 60, 90, 120, 150].map(y => (
                <line key={y} x1="0" y1={y} x2="820" y2={y} stroke="#e2e8f0" strokeWidth="1" />
              ))}
              <path
                d={pathD + " L820,180 L0,180 Z"}
                fill="url(#areaGrad)"
              />
              <path
                d={pathD}
                stroke="#4361ee"
                strokeWidth="2.5"
                fill="none"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-2 px-1">
            {["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя"].map(m => (
              <span key={m} className="text-xs text-muted-foreground">{m}</span>
            ))}
          </div>
        </div>

        {/* Top users */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground uppercase tracking-wide">ТОП АКТИВНЫХ</p>
            <button className="text-muted-foreground hover:text-foreground">
              <Icon name="MoreHorizontal" size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={u.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{u.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                  <span className={`badge-role ${roleColors[u.role]}`}>{u.role}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{u.actions}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Активных 2FA", value: "847", total: "1 284", pct: 66, color: "bg-green-500" },
          { label: "Заблокировано", value: "23", total: "1 284", pct: 2, color: "bg-red-500" },
          { label: "Новых за 30 дней", value: "156", total: "1 284", pct: 12, color: "bg-primary" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">из {item.total}</p>
            </div>
            <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{item.pct}% от всех пользователей</p>
          </div>
        ))}
      </div>
    </div>
  );
}
