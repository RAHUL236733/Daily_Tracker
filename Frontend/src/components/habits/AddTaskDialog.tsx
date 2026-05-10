import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, Task } from "@/lib/data";

const categories: Category[] = ["Health", "Mind", "Work", "Learning", "Personal"];

export function AddTaskDialog({ onAdd, floating = false }: { onAdd: (task: Task) => void; floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Health");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("15");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ id: crypto.randomUUID(), name, category, time, duration: `${duration} min`, completed: false });
    setName(""); setDuration("15");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {floating ? (
          <Button
            size="icon"
            className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full shadow-elevated md:hidden"
            aria-label="Add task"
          >
            <Plus className="h-6 w-6" />
          </Button>
        ) : (
          <Button className="w-full rounded-lg shadow-soft sm:w-auto">
            <Plus className="h-4 w-4" /> New habit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new habit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Drink 2L water"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={submit}>
            Create habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
