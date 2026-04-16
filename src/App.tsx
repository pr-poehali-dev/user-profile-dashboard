import { useState } from "react";
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

const queryClient = new QueryClient();

type Screen = "login" | "register" | "forgot";

function AppRouter() {
  const { user, authStep, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("login");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );

  // Авторизован — дашборд
  if (user) return <Index />;

  // Ожидание 2FA
  if (authStep === "2fa") return <TwoFactorPage />;

  // Экраны auth
  if (screen === "register") return <RegisterPage onGoLogin={() => setScreen("login")} />;
  if (screen === "forgot") return <ForgotPasswordPage onGoLogin={() => setScreen("login")} />;

  return (
    <LoginPage
      onGoRegister={() => setScreen("register")}
      onGoForgot={() => setScreen("forgot")}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppRouter />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;