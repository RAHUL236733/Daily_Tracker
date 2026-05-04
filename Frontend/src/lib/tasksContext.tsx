import React, { createContext, useContext, useEffect, useState } from "react";
import { type Category, type Task } from "./data";
import { getJson, patchJson, postJson } from "@/lib/api";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";

type TasksContextType = {
  tasks: Task[];
  addTask: (t: Task) => void;
  toggle: (id: string) => void;
};

type BackendTask = {
  _id: string;
  title: string;
  category: string;
  targetTime?: number;
  completed?: boolean;
};

const allowedCategories: Category[] = ["Health", "Mind", "Work", "Learning", "Personal"];

const normalizeCategory = (value: string): Category => {
  if (allowedCategories.includes(value as Category)) return value as Category;
  return "Personal";
};

const mapTask = (task: BackendTask): Task => ({
  id: task._id,
  name: task.title,
  category: normalizeCategory(task.category),
  time: "09:00",
  duration: `${task.targetTime || 0} min`,
  completed: Boolean(task.completed),
});

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const auth = useAuth();
  const { push } = useNotifications();

  useEffect(() => {
    let mounted = true;

    const loadTasks = async () => {
      if (!auth.isAuthenticated) {
        if (mounted) setTasks([]);
        return;
      }

      try {
        const response = await getJson<{ success: boolean; tasks: BackendTask[] }>("/api/tasks");
        if (!mounted) return;
        setTasks((response.tasks || []).map(mapTask));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load tasks", error);
      }
    };

    loadTasks();
    return () => {
      mounted = false;
    };
  }, [auth.isAuthenticated, auth.user?._id]);

  const addTask = (t: Task) => {
    const durationValue = Number.parseInt(String(t.duration).replace(/\D/g, ""), 10);

    postJson<{ success: boolean; task: BackendTask }>("/api/tasks", {
      title: t.name,
      category: t.category,
      targetTime: Number.isNaN(durationValue) ? 0 : durationValue,
      description: "",
    })
      .then((response) => {
        setTasks((current) => [mapTask(response.task), ...current]);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to add task", error);
      });
  };

  const toggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.completed) return;

    patchJson<{ success: boolean }>(`/api/tasks/${id}/complete`, {})
      .then(() => {
        setTasks((current) => current.map((t) => (t.id === id ? { ...t, completed: true } : t)));
        if (push) push({ title: "Habit completed", body: `${task.name} marked done. Nice!`, tone: "success" });
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to complete task", error);
      });
  };

  return (
    <TasksContext.Provider value={{ tasks, addTask, toggle }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
