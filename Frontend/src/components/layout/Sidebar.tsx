import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ListChecks, Calendar, BarChart3, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: ListChecks },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const path = useLocation().pathname;
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-4.5 w-4.5" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">Habit Tracker</p>
          <p className="text-[11px] text-muted-foreground">Build better days</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {items.map((item) => {
          const active = path === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary-soft text-primary shadow-soft"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  active && "text-primary",
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.65_0.18_290)] p-4 text-primary-foreground shadow-elevated">
        <p className="text-xs font-medium opacity-90">Pro tip</p>
        <p className="mt-1 text-sm font-semibold leading-snug">
          Small habits compound into remarkable results.
        </p>
      </div>
    </aside>
  );
}
