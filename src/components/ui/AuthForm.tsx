"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";

type Mode = "login" | "register" | "forgot" | "reset" | "resend";
const copy = {
  login: ["Welcome back", "Sign in to continue to your performance workspace", "Sign in"],
  register: ["Create your account", "Start tracking meaningful growth with your team", "Create account"],
  forgot: ["Reset your password", "We'll send a secure reset link to your inbox", "Send reset link"],
  reset: [
    "Choose a new password",
    "Use at least 10 characters with uppercase, lowercase, and a number",
    "Update password",
  ],
  resend: [
    "Resend verification email",
    "We'll send a fresh verification link to your inbox",
    "Send verification email",
  ],
} as const;

export function AuthForm({ mode, token }: { mode: Mode; token?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, string> = {};
    form.forEach((v, k) => (body[k] = String(v)));
    if (token) body.token = token;
    try {
      const response = await fetch(
        `/api/auth/${mode === "forgot" ? "forgot-password" : mode === "reset" ? "reset-password" : mode === "resend" ? "resend-verification" : mode}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(result.data.message);
      if (mode === "login") router.push("/dashboard");
      if (mode === "reset") setTimeout(() => router.push("/login"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div>
          <span className="eyebrow">PERFORMANCE GROWTH TRACKING</span>
          <h1>
            Build a culture
            <br />
            <em>measurable progress.</em>
          </h1>
          <p>Align every employee, KPI, and conversation around the work that drives your team forward.</p>
          <div className="trust-row">
            <ShieldCheck size={20} />
            <span>Secure sessions · Role-based access · Private by design</span>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="eyebrow purple">YOUR WORKSPACE</div>
          <h2>{copy[mode][0]}</h2>
          <p className="auth-sub">{copy[mode][1]}</p>
          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <label>
                Full name
                <input name="name" required minLength={2} autoComplete="name" placeholder="Ayesha Khan" />
              </label>
            )}
            {mode !== "reset" && (
              <label>
                Work email
                <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" />
              </label>
            )}
            {(mode === "login" || mode === "register" || mode === "reset") && (
              <label>
                Password
                <div className="auth-password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={mode === "login" ? 1 : 10}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            )}
            {error && <div className="form-alert error">{error}</div>}
            {message && <div className="form-alert success">{message}</div>}
            <button className="auth-submit" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : null}
              {copy[mode][2]}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="auth-links">
            {mode === "login" && (
              <>
                <Link href="/forgot-password">Forgot password?</Link>
                <Link href="/resend-verification">Need a new verification email?</Link>
                <span>
                  New here? <Link href="/register">Create an account</Link>
                </span>
              </>
            )}
            {mode === "register" && (
              <span>
                Already have an account? <Link href="/login">Sign in</Link>
              </span>
            )}
            {(mode === "forgot" || mode === "reset" || mode === "resend") && <Link href="/login">Back to sign in</Link>}
          </div>
        </div>
      </section>
    </main>
  );
}
