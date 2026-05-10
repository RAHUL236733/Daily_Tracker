import { FormEvent, useEffect, useState } from "react";
import { Moon, Sun, Search, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { NotificationsMenu } from "./NotificationsMenu";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/lib/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sidebarItems } from "./Sidebar";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { theme, toggle } = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    navigate(`/tasks${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-5 md:flex-nowrap md:gap-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="flex items-center gap-2 text-base">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                Habit Tracker
              </SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 px-3 py-4">
              {sidebarItems.map((item) => {
                const active = pathname === item.url;
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-soft text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-foreground">Habit Tracker</span>
      </div>

      <form className="relative hidden flex-1 md:block md:max-w-md" onSubmit={handleSubmit}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search habits, tasks..."
          className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-16 text-sm outline-none transition focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20 md:h-9"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 md:h-7"
        >
          Go
        </button>
      </form>

      <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle theme"
          className="transition-transform active:scale-95"
        >
          {theme === "light" ? (
            <Moon className="h-[1.15rem] w-[1.15rem]" />
          ) : (
            <Sun className="h-[1.15rem] w-[1.15rem]" />
          )}
        </Button>

        <NotificationsMenu />

        {auth.isAuthenticated ? (
          <ProfileDropdown />
        ) : (
          <Link
            to="/login"
            className="rounded-md px-2 py-1 text-sm transition hover:bg-muted active:scale-95 md:px-3"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
