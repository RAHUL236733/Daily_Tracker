import { Bell, CheckCircle2, Flame, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: typeof Bell;
  tone: "success" | "streak" | "info";
  unread: boolean;
};

const initial: Notification[] = [
  { id: "1", title: "Streak extended!", body: "You hit a 5-day streak. Keep it going 🔥", time: "2m ago", icon: Flame, tone: "streak", unread: true },
  { id: "2", title: "Habit completed", body: "Morning meditation marked done.", time: "1h ago", icon: CheckCircle2, tone: "success", unread: true },
  { id: "3", title: "New weekly insight", body: "You're 6% more consistent than last week.", time: "Yesterday", icon: Sparkles, tone: "info", unread: false },
];

const toneStyles: Record<Notification["tone"], string> = {
  success: "bg-success/15 text-success",
  streak: "bg-[oklch(0.95_0.07_45)] text-[oklch(0.55_0.18_45)] dark:bg-[oklch(0.3_0.06_45)] dark:text-[oklch(0.85_0.15_45)]",
  info: "bg-primary-soft text-primary",
};

export function NotificationsMenu() {
  const [items, setItems] = useState<Notification[]>(initial);
  const unread = items.filter((n) => n.unread).length;

  const markAll = () => setItems((xs) => xs.map((n) => ({ ...n, unread: false })));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative transition-transform active:scale-95"
          aria-label="Notifications"
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[340px] rounded-2xl p-0 shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">{unread} unread</p>
          </div>
          <button
            onClick={markAll}
            className="text-xs font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
            disabled={unread === 0}
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto py-1">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground">No new notifications.</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneStyles[n.tone])}>
                  <n.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {n.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">{n.time}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border p-2">
          <button className="w-full rounded-lg px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary-soft">
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
