export type Category = "Health" | "Mind" | "Work" | "Learning" | "Personal";

export type Task = {
  id: string;
  name: string;
  category: Category;
  time: string;
  duration: string;
  completed: boolean;
};

export const categoryStyles: Record<Category, string> = {
  Health: "bg-[oklch(0.94_0.06_155)] text-[oklch(0.35_0.1_155)] dark:bg-[oklch(0.3_0.06_155)] dark:text-[oklch(0.85_0.1_155)]",
  Mind: "bg-[oklch(0.94_0.06_280)] text-[oklch(0.35_0.1_280)] dark:bg-[oklch(0.3_0.06_280)] dark:text-[oklch(0.85_0.1_280)]",
  Work: "bg-[oklch(0.94_0.05_255)] text-[oklch(0.35_0.12_255)] dark:bg-[oklch(0.3_0.06_255)] dark:text-[oklch(0.85_0.1_255)]",
  Learning: "bg-[oklch(0.95_0.06_75)] text-[oklch(0.4_0.1_75)] dark:bg-[oklch(0.3_0.06_75)] dark:text-[oklch(0.85_0.1_75)]",
  Personal: "bg-[oklch(0.94_0.05_180)] text-[oklch(0.35_0.1_200)] dark:bg-[oklch(0.3_0.06_200)] dark:text-[oklch(0.85_0.1_200)]",
};

export const initialTasks: Task[] = [
  { id: "1", name: "Morning meditation", category: "Mind", time: "06:30", duration: "10 min", completed: true },
  { id: "2", name: "Run 3km", category: "Health", time: "07:00", duration: "25 min", completed: true },
  { id: "3", name: "Read 20 pages", category: "Learning", time: "08:30", duration: "30 min", completed: true },
  { id: "4", name: "Deep work session", category: "Work", time: "10:00", duration: "90 min", completed: false },
  { id: "5", name: "Journal reflection", category: "Personal", time: "21:00", duration: "10 min", completed: false },
];

export const weeklyStats = [
  { day: "Mon", completed: 4, total: 5 },
  { day: "Tue", completed: 5, total: 5 },
  { day: "Wed", completed: 3, total: 5 },
  { day: "Thu", completed: 5, total: 5 },
  { day: "Fri", completed: 4, total: 5 },
  { day: "Sat", completed: 2, total: 4 },
  { day: "Sun", completed: 3, total: 5 },
];

export const categoryBreakdown = [
  { name: "Health", value: 28 },
  { name: "Mind", value: 18 },
  { name: "Work", value: 22 },
  { name: "Learning", value: 16 },
  { name: "Personal", value: 12 },
];

// Completed days within a month (day numbers)
export const completedDays = new Set([1, 2, 3, 5, 6, 8, 9, 10, 11, 13, 15, 16, 17, 19, 20, 22, 23, 24, 26, 27]);
