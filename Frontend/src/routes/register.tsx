import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/habits/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — Habit Tracker" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useRouter().navigate;

  useEffect(() => {
    if (auth.isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [auth.isAuthenticated, navigate]);

  if (auth.isLoading) {
    return <div className="mx-auto max-w-md py-10 text-sm text-muted-foreground">Loading session...</div>;
  }

  if (auth.isAuthenticated) {
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth.register(name, email, password);
      navigate({ to: "/" });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Create account" subtitle="Start tracking your habits." />

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-sm text-muted-foreground">
        Already have an account? <a href="/login" className="text-primary">Sign in</a>
      </div>
    </div>
  );
}
