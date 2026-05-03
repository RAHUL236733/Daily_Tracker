import type { ReactNode } from "react";
import { } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const hideSidebar = ["/login", "/register", "/forgot-password", "/verify-otp"].includes(pathname);
  const hideTopbar = ["/login", "/register", "/forgot-password", "/verify-otp"].includes(pathname);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {!hideSidebar && <AppSidebar />}
      <div className={`flex min-w-0 flex-1 flex-col ${hideSidebar ? "" : ""}`}>
        {!hideTopbar && <Topbar />}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
