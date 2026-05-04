import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({ meta: [{ title: "Verify OTP — Habit Tracker" }] }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [sent, setSent] = useState(true);
  const [email, setEmail] = useState("");
  const navigate = useRouter().navigate;

  useEffect(() => {
    let t: number | undefined;
    if (sent && timer > 0) {
      t = window.setTimeout(() => setTimer((s) => s - 1), 1000);
    }
    return () => { if (t) clearTimeout(t); };
  }, [timer, sent]);

  useEffect(() => {
    const stored = localStorage.getItem("dt_reset_email");
    if (!stored) {
      navigate({ to: "/forgot-password" });
      return;
    }
    setEmail(stored);
  }, [navigate]);

  const resend = async () => {
    if (!email) return;
    setError("");
    setLoading(true);

    try {
      await postJson<{ success: boolean; message: string }>("/api/auth/forgot-password", { email });
      setSent(true);
      setTimer(30);
    } catch (authError) {
      console.error("resend otp error:", authError);
      setError(authError instanceof Error ? authError.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // eslint-disable-next-line no-console
    console.log('verify-otp: email=', email, 'otp=', otp, 'otp length=', otp.length);

    if (!otp || !/^[0-9]{4,6}$/.test(otp)) {
      setError("OTP must be 4-6 digits");
      // eslint-disable-next-line no-console
      console.error('OTP validation failed:', { otp, matches: /^[0-9]{4,6}$/.test(otp) });
      return;
    }
    setLoading(true);
    try {
      // eslint-disable-next-line no-console
      console.log('Sending verify-otp request:', { email, otp });
      await postJson<{ success: boolean; message: string }>("/api/auth/verify-otp", { email, otp });
      // eslint-disable-next-line no-console
      console.log('verify-otp successful');
      navigate({ to: "/reset-password" });
    } catch (authError) {
      // eslint-disable-next-line no-console
      console.error("verify otp error:", authError);
      setError(authError instanceof Error ? authError.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="flex justify-center">
        <Card className="bg-white dark:bg-card rounded-2xl shadow-lg p-6 w-full">
          <CardHeader>
            <CardTitle>Verify OTP</CardTitle>
            <CardDescription>Enter the OTP sent to your email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={verify} className="space-y-4">
              <div className="text-center">
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mx-auto text-center tracking-widest text-lg font-semibold w-40"
                  placeholder="----"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {timer > 0 ? (
                    <span className="text-muted-foreground">Resend in {timer}s</span>
                  ) : (
                    <button type="button" onClick={resend} className="text-indigo-600 hover:underline">Resend OTP</button>
                  )}
                </div>
                <Button type="submit" className="bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-500 transition-all duration-150 ease-out active:scale-[0.97]">
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    "Verify"
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
