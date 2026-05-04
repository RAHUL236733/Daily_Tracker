import { FormEvent, useEffect, useState } from "react";
import { Moon, Sun, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { NotificationsMenu } from "./NotificationsMenu";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/lib/auth";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function Topbar() {
  const { theme, toggle } = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useRouterState({
    select: (state) => ({ pathname: state.location.pathname, search: state.location.search }),
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(search || "");
    const q = params.get("q") || "";
    if (pathname === "/tasks") {
      setQuery(q);
    }
  }, [pathname, search]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();

    navigate({
      to: "/tasks",
      search: q ? { q } : {},
    });
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur-md">
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <form className="relative ml-0 flex-1 max-w-md" onSubmit={handleSubmit}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search habits, tasks..."
          className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-16 text-sm outline-none transition focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 h-7 -translate-y-1/2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Go
        </button>
      </form>

      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="transition-transform active:scale-95">
        {theme === "light" ? <Moon className="h-[1.15rem] w-[1.15rem]" /> : <Sun className="h-[1.15rem] w-[1.15rem]" />}
      </Button>

      <NotificationsMenu />

      {/* Right side actions container */}
      <div className="ml-auto flex flex-shrink-0 items-center gap-4 md:gap-5">
        {/* Profile Dropdown or Sign In */}
        {auth.isAuthenticated ? (
          <ProfileDropdown />
        ) : (
          <a href="/login" className="rounded-md px-3 py-1 text-sm transition hover:bg-muted active:scale-95">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
