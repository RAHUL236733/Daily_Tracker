import { createFileRoute } from "@tanstack/react-router";
import { TaskCard } from "@/components/habits/TaskCard";
import { AddTaskDialog } from "@/components/habits/AddTaskDialog";
import { PageHeader } from "@/components/habits/PageHeader";
import { type Task } from "@/lib/data";
import { useTasks } from "@/lib/tasksContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Habit Tracker" },
      { name: "description", content: "Manage your daily habits and tasks." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { tasks, addTask, toggle } = useTasks();
  const search = useRouterState({ select: (state) => state.location.search });

  const params = new URLSearchParams(search || "");
  const query = (params.get("q") || "").trim().toLowerCase();

  const filterByQuery = (list: Task[]) => {
    if (!query) return list;
    return list.filter((task) => {
      const haystack = `${task.name} ${task.category} ${task.duration}`.toLowerCase();
      return haystack.includes(query);
    });
  };

  const add = addTask;

  const filters = {
    all: filterByQuery(tasks),
    pending: filterByQuery(tasks.filter((t) => !t.completed)),
    completed: filterByQuery(tasks.filter((t) => t.completed)),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="All tasks"
        subtitle={query ? `Search results for "${query}"` : "Organize, track and complete your daily habits."}
        actions={<AddTaskDialog onAdd={add} />}
      />

      <Tabs defaultValue="all">
        <TabsList className="rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="all" className="rounded-lg">All ({filters.all.length})</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg">Pending ({filters.pending.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg">Done ({filters.completed.length})</TabsTrigger>
        </TabsList>

        {(["all", "pending", "completed"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-5 space-y-3">
            {filters[key].length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                <p className="text-sm font-semibold">Nothing here yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different filter or add a new habit.</p>
              </div>
            ) : (
              filters[key].map((t) => <TaskCard key={t.id} task={t} onToggle={toggle} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
