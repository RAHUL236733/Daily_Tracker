import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Target, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/habits/PageHeader";
import { StatCard } from "@/components/habits/StatCard";
import { TaskCard } from "@/components/habits/TaskCard";
import { AddTaskDialog } from "@/components/habits/AddTaskDialog";
import { Progress } from "@/components/ui/progress";
import { useTasks } from "@/lib/tasksContext";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Habit Tracker" },
      { name: "description", content: "Your daily progress, streaks, and habits at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tasks, addTask, toggle } = useTasks();
  const auth = useAuth();

  const [dashboard, setDashboard] = useState({
    totalHabits: 0,
    completedHabitsToday: 0,
    completionPercentage: 0,
    overallStreak: 0,
    bestStreak: 0,
    weeklyCompletionData: [
      { day: "Mon", completed: 0 },
      { day: "Tue", completed: 0 },
      { day: "Wed", completed: 0 },
      { day: "Thu", completed: 0 },
      { day: "Fri", completed: 0 },
      { day: "Sat", completed: 0 },
      { day: "Sun", completed: 0 },
    ],
  });

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const response = await getJson<{
          success: boolean;
          dashboard: {
            totalHabits: number;
            completedHabitsToday: number;
            completionPercentage: number;
            overallStreak: number;
            bestStreak: number;
            weeklyCompletionData: Array<{ day: string; completed: number }>;
          };
        }>("/api/dashboard");

        if (!mounted) return;
        setDashboard((prev) => ({
          ...prev,
          ...response.dashboard,
          weeklyCompletionData:
            response.dashboard?.weeklyCompletionData?.length === 7
              ? response.dashboard.weeklyCompletionData
              : prev.weeklyCompletionData,
        }));
      } catch (error) {
        console.error("Failed to load dashboard", error);
      }
    };

    if (auth.isAuthenticated) {
      loadDashboard();
    }

    return () => {
      mounted = false;
    };
  }, [auth.isAuthenticated, tasks]);

  if (auth.isLoading) {
    return (
      <div className="mx-auto max-w-7xl py-10 text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  const completed = dashboard.completedHabitsToday;
  const total = dashboard.totalHabits;
  const pct = dashboard.completionPercentage;

  // `toggle` and `addTask` are provided by the shared tasks context

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Welcome, ${auth.user?.name || "there"} 👋`}
        subtitle="Here's how your day is shaping up."
        actions={<AddTaskDialog onAdd={addTask} />}
      />

      {/* Hero progress */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-[oklch(0.6_0.18_280)] p-6 text-primary-foreground shadow-elevated">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> Today's progress
            </div>
            <p className="mt-4 text-4xl font-bold">
              {completed}/{total} habits
            </p>
            <p className="mt-1 text-sm opacity-90">You're {pct}% there. Keep the momentum going.</p>
            <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(0.95_0.07_45)] text-[oklch(0.5_0.15_45)] dark:bg-[oklch(0.3_0.06_45)] dark:text-[oklch(0.85_0.15_45)]">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current streak</p>
              <p className="text-2xl font-bold">{dashboard.overallStreak} days 🔥</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Best streak: {dashboard.bestStreak} days
          </p>
          <div className="mt-3 flex gap-1">
            {dashboard.weeklyCompletionData.map((item, i) => (
              <div
                key={i}
                className={`h-8 flex-1 rounded-md ${item.completed > 0 ? "bg-[oklch(0.7_0.18_45)]" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completion rate"
          value={`${pct}%`}
          hint="Today"
          icon={Target}
          accent="primary"
        />
        <StatCard
          label="Tasks done"
          value={`${completed}/${total}`}
          hint="Completed today"
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Weekly average"
          value={`${Math.round(dashboard.weeklyCompletionData.reduce((sum, d) => sum + d.completed, 0) / 7)} habits/day`}
          hint="Last 7 days"
          icon={TrendingUp}
          accent="accent"
        />
        <StatCard
          label="Streak"
          value={`${dashboard.overallStreak} days`}
          hint={`Personal best: ${dashboard.bestStreak}`}
          icon={Flame}
          accent="streak"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today's habits</h2>
            <span className="text-xs text-muted-foreground">
              {completed} of {total} completed
            </span>
          </div>
          <div className="mb-3">
            <Progress value={pct} className="h-1.5" />
          </div>
          {tasks.length === 0 ? (
            <EmptyTasks />
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={toggle} />
              ))}
            </div>
          )}
        </div>

        {/* Weekly mini chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="text-sm font-semibold">This week</p>
          <p className="text-xs text-muted-foreground">Completed habits per day</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboard.weeklyCompletionData}
                margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="oklch(0.92 0.01 255)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.94 0.04 255 / 0.4)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="completed" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <AddTaskDialog onAdd={addTask} floating />
    </div>
  );
}

function EmptyTasks() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold">No habits yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Add your first habit to start building momentum.
      </p>
    </div>
  );
}
