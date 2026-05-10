import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, hint, icon: Icon, accent = "primary",
}: {
  label: string; value: string; hint?: string; icon: LucideIcon;
  accent?: "primary" | "success" | "streak" | "accent";
}) {
  const accents = {
    primary: "bg-primary-soft text-primary",
    success: "bg-[oklch(0.94_0.06_155)] text-[oklch(0.4_0.12_155)] dark:bg-[oklch(0.3_0.06_155)] dark:text-[oklch(0.85_0.12_155)]",
    streak: "bg-[oklch(0.95_0.07_45)] text-[oklch(0.5_0.15_45)] dark:bg-[oklch(0.3_0.06_45)] dark:text-[oklch(0.85_0.15_45)]",
    accent: "bg-accent text-accent-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-elevated sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-bold tracking-tight md:text-2xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground md:text-sm">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
