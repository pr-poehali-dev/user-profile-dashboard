import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import DashboardPage from "@/components/dashboard/DashboardPage";
import UsersPage from "@/components/dashboard/UsersPage";
import ProfilePage from "@/components/dashboard/ProfilePage";
import SettingsPage from "@/components/dashboard/SettingsPage";
import ActivityPage from "@/components/dashboard/ActivityPage";
import HomePage from "@/components/dashboard/HomePage";

type Page = "home" | "dashboard" | "users" | "profile" | "settings" | "activity";

const navItems = [
  { id: "home", label: "Главная", icon: "House" },
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "users", label: "Пользователи", icon: "Users" },
  { id: "profile", label: "Мой профиль", icon: "UserCircle" },
  { id: "settings", label: "Настройки", icon: "Settings" },
  { id: "activity", label: "История действий", icon: "Activity" },
] as const;

export default function Index() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<Page>("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (activePage) {
      case "home": return <HomePage />;
      case "dashboard": return <DashboardPage />;
      case "users": return <UsersPage />;
      case "profile": return <ProfilePage />;
      case "settings": return <SettingsPage />;
      case "activity": return <ActivityPage />;
    }
  };

  const currentNav = navItems.find(n => n.id === activePage);

  const handleNavClick = (id: string) => {
    if (id === "profile" && user) {
      navigate(`/профиль/${user.id}`);
    } else {
      setActivePage(id as Page);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col bg-white border-r border-border transition-all duration-300 z-20"
        style={{ width: sidebarOpen ? "260px" : "64px", flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Icon name="Zap" size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg text-foreground tracking-tight">
              Admin<span className="text-primary">Panel</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sidebarOpen && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2 mb-1">
              Меню
            </p>
          )}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`nav-link w-full ${activePage === item.id && item.id !== "profile" ? "active" : ""} ${!sidebarOpen ? "justify-center px-0" : ""}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon name={item.icon} size={18} className="flex-shrink-0" />
              {sidebarOpen && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {sidebarOpen && item.id === "profile" && (
                <Icon name="ExternalLink" size={12} className="opacity-40" />
              )}
            </button>
          ))}
        </nav>

        {/* User mini */}
        <div className={`p-3 border-t border-border ${sidebarOpen ? "" : "flex flex-col items-center gap-2"}`}>
          {sidebarOpen ? (
            <div className="space-y-1">
              <button
                onClick={() => user && navigate(`/профиль/${user.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{user?.avatar ?? "?"}</span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
                <Icon name="ExternalLink" size={12} className="text-muted-foreground opacity-50 flex-shrink-0" />
              </button>
              <button
                onClick={logout}
                className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Icon name="LogOut" size={16} className="flex-shrink-0" />
                <span>Выйти</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => user && navigate(`/профиль/${user.id}`)}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer"
                title="Мой профиль"
              >
                <span className="text-xs font-bold text-primary">{user?.avatar ?? "?"}</span>
              </button>
              <button
                onClick={logout}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                title="Выйти"
              >
                <Icon name="LogOut" size={15} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
            >
              <Icon name="Menu" size={18} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground">{currentNav?.label}</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск..."
                className="w-48 h-8 pl-8 pr-3 text-sm bg-secondary border-0 rounded-lg outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
              <Icon name="Search" size={14} className="absolute left-2.5 top-2 text-muted-foreground" />
            </div>
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
              <Icon name="Bell" size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <button
              onClick={() => user && navigate(`/профиль/${user.id}`)}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
              title={`${user?.name} — открыть профиль`}
            >
              <span className="text-xs font-bold text-primary">{user?.avatar ?? "?"}</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-slide-up" key={activePage}>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
