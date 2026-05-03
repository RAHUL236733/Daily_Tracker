import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryStyles, type Task } from "@/lib/data";

export function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated",
        task.completed && "opacity-70"
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 ease-out active:scale-90",
          task.completed
            ? "border-success bg-success text-success-foreground"
            : "border-border bg-background hover:border-primary hover:bg-primary-soft"
        )}
      >
        {task.completed && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", task.completed && "line-through text-muted-foreground")}>
          {task.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", categoryStyles[task.category])}>
            {task.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {task.time} · {task.duration}
          </span>
        </div>
      </div>
    </div>
  );
}
