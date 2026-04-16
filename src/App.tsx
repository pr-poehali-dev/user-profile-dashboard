import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
 
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import TwoFactorPage from "@/pages/TwoFactorPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import Index from "@/pages/Index";
import UserProfilePage from "@/pages/UserProfilePage";

const queryClient = new QueryClient();

type Screen = "login" | "register" | "forgot";

const ADMIN_ROLES = ["Администратор", "Менеджер", "Модератор"];

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}

// Охраняет /админка — пускает только авторизованных с нужной ролью
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, authStep, loading } = useAuth();
  if (loading) return <Spinner />;
  if (authStep === "2fa") return <TwoFactorWrapper />;
  if (!user) return <AuthFlow />;
  if (!ADMIN_ROLES.includes(user.role)) {
    // Обычный пользователь → его профиль
    return <Navigate to={`/профиль/${user.id}`} replace />;
  }
  return <>{children}</>;
}

// Для маршрута / — редиректит по роли
function RootRedirect() {
  const { user, authStep, loading } = useAuth();
  if (loading) return <Spinner />;
  if (authStep === "2fa") return <TwoFactorWrapper />;
  if (!user) return <AuthFlow />;
  if (ADMIN_ROLES.includes(user.role)) return <Navigate to="/админка" replace />;
  return <Navigate to={`/профиль/${user.id}`} replace />;
}

// 2FA обёртка
function TwoFactorWrapper() {
  return <TwoFactorPage />;
}

// Блок auth-экранов (логин / регистрация / восстановление)
function AuthFlow() {
  const { authStep } = useAuth();
  const [screen, setScreen] = useState<Screen>("login");

  if (authStep === "2fa") return <TwoFactorPage />;

  if (screen === "register") return <RegisterPage onGoLogin={() => setScreen("login")} />;
  if (screen === "forgot") return <ForgotPasswordPage onGoLogin={() => setScreen("login")} />;

  return (
    <LoginPage
      onGoRegister={() => setScreen("register")}
      onGoForgot={() => setScreen("forgot")}
    />
  );
}

// Страница профиля — доступна всем (публичная)
function ProfileRoute() {
  return <UserProfilePage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Публичный профиль — доступен без авторизации */}
      <Route path="/профиль/:id" element={<ProfileRoute />} />

      {/* Админка — только для персонала */}
      <Route path="/админка" element={
        <AdminGuard>
          <Index />
        </AdminGuard>
      } />

      {/* Корень — умный редирект */}
      <Route path="/" element={<RootRedirect />} />

      {/* Всё остальное → на корень */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;