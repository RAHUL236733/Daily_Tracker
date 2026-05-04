import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const navigate = useRouter().navigate;

  useEffect(() => {
    if (auth.isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [auth.isAuthenticated, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth.login(email, password);
      navigate({ to: "/" });
    } catch (authError) {
      console.error("Login error", authError);
      setError(authError instanceof Error ? authError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isNotRegisteredError = error && error.includes('Not registered');
  const displayError = error && !isNotRegisteredError ? error : null;
  const sessionNotice = auth.authNotice;

  if (auth.isAuthenticated) {
    return null;
  }

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

        {sessionNotice ? <p className="text-sm font-medium text-red-500">{sessionNotice}</p> : null}
        {displayError ? <p className="text-sm text-destructive">{displayError}</p> : null}

        <div className="space-y-2">
          {isNotRegisteredError ? (
            <p className="text-sm text-red-500 font-medium">Not registered. Please sign up first.</p>
          ) : null}
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
