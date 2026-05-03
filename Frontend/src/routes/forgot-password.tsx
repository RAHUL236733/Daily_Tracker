import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — Habit Tracker" }] }),
  component: ForgotPasswordPage,
});

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateEmail(email)) {
      setError("Invalid email");
      return;
    }
    setLoading(true);
    try {
      await postJson<{ success: boolean; message: string }>("/api/auth/forgot-password", { email });
      setSuccess("OTP sent successfully");
      localStorage.setItem("dt_reset_email", email);
      window.location.href = "/verify-otp";
    } catch (authError) {
      console.error("forgot-password error:", authError);
      setError(authError instanceof Error ? authError.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="flex justify-center">
        <Card className="bg-white dark:bg-card rounded-2xl shadow-lg p-6 w-full">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Enter your email to receive an OTP</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <div className="flex justify-end">
                <Button type="submit" className="bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-500 transition-all duration-150 ease-out active:scale-[0.97]">
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
