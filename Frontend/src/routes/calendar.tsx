import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/habits/PageHeader";
import { Button } from "@/components/ui/button";
import { getJson } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Habit Tracker" },
      { name: "description", content: "Visualize your habit completion across the month." },
    ],
  }),
  component: CalendarPage,
});

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null);
  const [countsByDate, setCountsByDate] = useState<Record<string, number>>({});

  const activeCursor = cursor || { y: today.getFullYear(), m: today.getMonth() };

  useEffect(() => {
    let mounted = true;

    const loadCalendarData = async () => {
      try {
        const query = cursor ? `?year=${cursor.y}&month=${cursor.m + 1}` : "";

        const response = await getJson<{
          success: boolean;
          dashboard: {
            monthlyCalendarData: Array<{ date: string; completedCount: number }>;
            calendarMonth: number;
            calendarYear: number;
          };
        }>(`/api/dashboard${query}`);

        if (!mounted) return;

        if (!cursor) {
          setCursor({
            y: response.dashboard.calendarYear,
            m: response.dashboard.calendarMonth - 1,
          });
        }

        const next: Record<string, number> = {};
        for (const item of response.dashboard.monthlyCalendarData || []) {
          next[item.date] = item.completedCount;
        }
        setCountsByDate(next);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load calendar analytics", error);
      }
    };

    loadCalendarData();

    return () => {
      mounted = false;
    };
  }, [cursor]);

  const firstDay = new Date(activeCursor.y, activeCursor.m, 1).getDay();
  const daysInMonth = new Date(activeCursor.y, activeCursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shift = (delta: number) => {
    const base = cursor || activeCursor;
    const m = base.m + delta;
    if (m < 0) setCursor({ y: base.y - 1, m: 11 });
    else if (m > 11) setCursor({ y: base.y + 1, m: 0 });
    else setCursor({ ...base, m });
  };

  const isToday = (d: number) =>
    d === today.getDate() && activeCursor.m === today.getMonth() && activeCursor.y === today.getFullYear();

  const monthPrefix = useMemo(
    () => `${activeCursor.y}-${String(activeCursor.m + 1).padStart(2, "0")}`,
    [activeCursor.y, activeCursor.m]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Calendar" subtitle="A bird's-eye view of your consistency." />

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{months[activeCursor.m]} {activeCursor.y}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dateKey = `${monthPrefix}-${String(d).padStart(2, "0")}`;
            const completedCount = countsByDate[dateKey] || 0;
            const done = completedCount > 0;
            return (
              <div
                key={i}
                className={cn(
                  "relative aspect-square rounded-xl border p-2 text-left text-sm transition hover:-translate-y-0.5 hover:shadow-soft",
                  done
                    ? "border-transparent bg-primary-soft text-primary"
                    : "border-border bg-background text-foreground",
                  isToday(d) && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                )}
              >
                <span className="font-semibold">{d}</span>
                {done && (
                  <span className="absolute bottom-2 right-2 inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {completedCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-primary-soft" /> Completed day</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded ring-2 ring-primary" /> Today</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-background border border-border" /> Missed / upcoming</div>
        </div>
      </div>
    </div>
  );
}
