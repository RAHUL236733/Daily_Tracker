import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { postJson, buildApiUrl } from "@/lib/api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateEmail(email)) {
      setError("Invalid email");
      return;
    }
    setLoading(true);
    // Resolve and show the URL we will call — useful for debugging "Failed to fetch" in-browser
    const resolved = buildApiUrl("/api/auth/forgot-password");

    try {
      await postJson<{ success: boolean; message: string }>(resolved, { email });
      setSuccess("OTP sent successfully");
      localStorage.setItem("dt_reset_email", email);
      navigate("/verify-otp");
    } catch (authError) {
      // eslint-disable-next-line no-console
      console.error("forgot-password error:", authError);

      if (authError instanceof Error) {
        // If the thrown error includes a URL (enhanced by apiJson), prefer a friendlier message
        const url = (authError as any).url || resolved;
        if (
          authError.message === "Failed to fetch" ||
          authError.message === "NetworkError when attempting to fetch resource."
        ) {
          setError(
            `Network error connecting to ${url}. Check backend is running, CORS, and dev server URL.`,
          );
        } else {
          setError(`${authError.message} (${url})`);
        }
      } else {
        setError("Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 sm:px-0">
      <div className="flex justify-center">
        <Card className="w-full rounded-2xl bg-white p-4 shadow-lg dark:bg-card sm:p-6">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Enter your email to receive an OTP</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-white transition-all duration-150 ease-out hover:bg-indigo-500 active:scale-[0.97] sm:w-auto"
                >
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
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
