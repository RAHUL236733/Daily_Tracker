import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

const authPaths = new Set(["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password"]);

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !authPaths.has(pathname)) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, pathname]);

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Checking session...</div>;
  }

  if (!isAuthenticated && !authPaths.has(pathname)) {
    return null;
  }

  return <>{children}</>;
}