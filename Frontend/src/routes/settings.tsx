import { PageHeader } from "@/components/habits/PageHeader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Profile</h2>
          <p className="text-xs text-muted-foreground">Update your personal information.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button>Save changes</Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground">Customize how Habit Tracker looks.</p>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Easier on the eyes at night.</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Notifications</h2>
          <p className="text-xs text-muted-foreground">
            Choose what you'd like to be reminded about.
          </p>
          <div className="mt-5 space-y-3">
            {[
              { label: "Daily morning summary", desc: "A recap of habits planned for today." },
              { label: "Streak reminders", desc: "Don't break your streak." },
              { label: "Weekly reports", desc: "Sent every Sunday evening." },
            ].map((it) => (
              <div
                key={it.label}
                className="flex items-center justify-between rounded-xl border border-border p-4"
              >
                <div>
                  <p className="text-sm font-medium">{it.label}</p>
                  <p className="text-xs text-muted-foreground">{it.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
