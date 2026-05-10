import { useEffect, useMemo, useState } from "react";
import { Target, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/habits/PageHeader";
import { StatCard } from "@/components/habits/StatCard";
import { getJson } from "@/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function AnalyticsPage() {
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

  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Array<{ name: string; value: number }>
  >([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [dashboardResponse, tasksResponse] = await Promise.all([
          getJson<{
            success: boolean;
            dashboard: {
              totalHabits: number;
              completedHabitsToday: number;
              completionPercentage: number;
              overallStreak: number;
              bestStreak: number;
              weeklyCompletionData: Array<{ day: string; completed: number }>;
            };
          }>("/api/dashboard"),
          getJson<{
            success: boolean;
            tasks: Array<{ category: string; completedDates?: string[] }>;
          }>("/api/tasks"),
        ]);

        if (!mounted) return;

        setDashboard((prev) => ({
          ...prev,
          ...dashboardResponse.dashboard,
          weeklyCompletionData:
            dashboardResponse.dashboard?.weeklyCompletionData?.length === 7
              ? dashboardResponse.dashboard.weeklyCompletionData
              : prev.weeklyCompletionData,
        }));

        const categoryMap = new Map<string, number>();
        for (const task of tasksResponse.tasks || []) {
          const key = task.category || "Personal";
          const completedCount = Array.isArray(task.completedDates)
            ? task.completedDates.length
            : 0;
          categoryMap.set(key, (categoryMap.get(key) || 0) + completedCount);
        }

        const breakdown = [...categoryMap.entries()].map(([name, value]) => ({ name, value }));
        setCategoryBreakdown(breakdown);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load analytics", error);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const weeklyAverage = useMemo(() => {
    const total = dashboard.weeklyCompletionData.reduce((sum, d) => sum + d.completed, 0);
    return Math.round(total / 7);
  }, [dashboard.weeklyCompletionData]);

  const pieData =
    categoryBreakdown.length > 0 ? categoryBreakdown : [{ name: "No data", value: 1 }];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-0">
      <PageHeader title="Analytics" subtitle="Track your performance and find patterns." />

      <div className="mb-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completion rate"
          value={`${dashboard.completionPercentage}%`}
          hint="Today"
          icon={Target}
          accent="primary"
        />
        <StatCard
          label="Total habits"
          value={`${dashboard.totalHabits}`}
          hint="Your habits"
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Best streak"
          value={`${dashboard.bestStreak} days`}
          hint="All time"
          icon={Flame}
          accent="streak"
        />
        <StatCard
          label="Weekly average"
          value={`${weeklyAverage}/day`}
          hint="Last 7 days"
          icon={TrendingUp}
          accent="accent"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft lg:col-span-3 sm:p-6">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold md:text-base">Weekly progress</p>
              <p className="text-xs text-muted-foreground md:text-sm">Tasks completed by day</p>
            </div>
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-[oklch(0.45_0.12_155)] dark:text-[oklch(0.85_0.12_155)]">
              ↑ 6%
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dashboard.weeklyCompletionData}
                margin={{ top: 16, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft lg:col-span-2 sm:p-6">
          <p className="text-sm font-semibold md:text-base">By category</p>
          <p className="text-xs text-muted-foreground md:text-sm">Distribution of completed habits</p>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={colors[i % colors.length]}
                      stroke="var(--card)"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
