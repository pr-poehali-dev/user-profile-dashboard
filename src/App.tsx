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
  const { user, authStep } = useAuth();
  const [screen, setScreen] = useState<Screen>("login");

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
