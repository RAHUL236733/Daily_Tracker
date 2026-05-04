import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { useAuth } from "@/lib/auth";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useLocation().pathname;
  const auth = useAuth();

  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-otp",
    "/reset-password",
  ].includes(pathname);

  if (isAuthPage) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  return (
    <PrivateRoute>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {auth.isAuthenticated ? <AppSidebar /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          {auth.isAuthenticated ? <Topbar /> : null}
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </PrivateRoute>
  );
}
