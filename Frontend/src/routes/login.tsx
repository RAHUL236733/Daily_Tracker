import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/habits/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Habit Tracker" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  if (auth.isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth.login(email, password);
    } catch (authError) {
      console.error("Login error", authError);
      setError(authError instanceof Error ? authError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Sign in" subtitle="Access your habit dashboard." />

      {auth.isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Checking session...</p>
      ) : null}

      <form
        onSubmit={submit}
        className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between">
          <a
            href="/forgot-password"
            className="text-indigo-600 hover:underline cursor-pointer text-sm"
          >
            Forgot Password?
          </a>
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-sm text-muted-foreground">
        Don't have an account?{" "}
        <a href="/register" className="text-primary">
          Register
        </a>
      </div>
    </div>
  );
}
