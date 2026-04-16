import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

const ADMIN_ROLES = ["Администратор", "Менеджер", "Модератор"];

type PublicUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
  created_at: string;
  last_login: string | null;
};

const roleColors: Record<string, string> = {
  "Администратор": "bg-primary/10 text-primary",
  "Менеджер": "bg-violet-100 text-violet-700",
  "Модератор": "bg-orange-100 text-orange-700",
  "Пользователь": "bg-gray-100 text-gray-600",
};

function formatDate(iso: string | null) {
  if (!iso) return "Никогда";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(currentUser?.role ?? "");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    api.getPublicProfile(id).then(({ status, data }) => {
      if (status === 200) setUser(data.user);
      else setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Загружаем профиль...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <Icon name="UserX" size={36} className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Профиль не найден</h2>
        <p className="text-muted-foreground text-sm mb-6">Пользователь с таким ID не существует или был удалён</p>
        <button onClick={() => navigate("/")}
          className="h-10 px-6 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
          На главную
        </button>
      </div>
    </div>
  );

  if (!user) return null;

  const isBlocked = user.status === "blocked";

  return (
    <div className="min-h-screen bg-background">
      {/* Топбар */}
      <header className="bg-white border-b border-border h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Zap" size={14} className="text-white" />
          </div>
          <span className="font-bold text-base">Admin<span className="text-primary">Panel</span></span>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="ArrowLeft" size={15} />
            Назад
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-8 animate-slide-up">
        {/* Карточка профиля */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Шапка-баннер */}
          <div className="h-28 bg-gradient-to-r from-primary/80 to-primary relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          </div>

          <div className="px-8 pb-8">
            {/* Аватар */}
            <div className="flex items-end justify-between -mt-10 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user.avatar || user.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              {isBlocked && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                  <Icon name="Ban" size={12} />
                  Аккаунт заблокирован
                </span>
              )}
            </div>

            {/* Имя и роль */}
            <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[user.role] || "bg-gray-100 text-gray-600"}`}>
                {user.role}
              </span>
            </div>

            {/* Разделитель */}
            <div className="my-6 border-t border-border" />

            {/* Детали */}
            <div className="space-y-4">
              {[
                { icon: "Mail", label: "Email", value: user.email },
                { icon: "Calendar", label: "В системе с", value: formatDate(user.created_at) },
                { icon: "Clock", label: "Последний вход", value: formatDate(user.last_login) },
                { icon: "Hash", label: "ID пользователя", value: `#${user.id}` },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon name={row.icon} size={15} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm font-medium text-foreground">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Подсказка со ссылкой */}
        <div className="mt-4 p-4 bg-white rounded-xl border border-border flex items-center gap-3">
          <Icon name="Link" size={16} className="text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Ссылка на этот профиль</p>
            <p className="text-xs font-mono text-foreground truncate">{window.location.href}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="h-7 px-2.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0"
          >
            Скопировать
          </button>
        </div>
      </div>
    </div>
  );
}