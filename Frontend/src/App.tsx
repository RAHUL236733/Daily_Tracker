import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/lib/auth";
import { NotificationsProvider } from "@/lib/notifications";
import { TasksProvider } from "@/lib/tasksContext";
import { ThemeProvider } from "@/lib/theme";
import DashboardPage from "@/routes/index";
import LoginPage from "@/routes/login";
import RegisterPage from "@/routes/register";
import ForgotPasswordPage from "@/routes/forgot-password";
import VerifyOtpPage from "@/routes/verify-otp";
import ResetPasswordPage from "@/routes/reset-password";
import TasksPage from "@/routes/tasks";
import CalendarPage from "@/routes/calendar";
import AnalyticsPage from "@/routes/analytics";
import SettingsPage from "@/routes/settings";

const titles: Record<string, string> = {
  "/": "Dashboard — Habit Tracker",
  "/login": "Login — Habit Tracker",
  "/register": "Register — Habit Tracker",
  "/forgot-password": "Reset Password — Habit Tracker",
  "/verify-otp": "Verify OTP — Habit Tracker",
  "/reset-password": "Reset Password — Habit Tracker",
  "/tasks": "Tasks — Habit Tracker",
  "/calendar": "Calendar — Habit Tracker",
  "/analytics": "Analytics — Habit Tracker",
  "/settings": "Settings — Habit Tracker",
};

function DocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    document.title = titles[location.pathname] || "Habit Tracker";
  }, [location.pathname]);

  return null;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-5xl font-bold sm:text-7xl">404</h1>
        <h2 className="mt-4 text-lg font-semibold sm:text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <DocumentTitle />
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationsProvider>
            <TasksProvider>
              <AppRoutes />
            </TasksProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
