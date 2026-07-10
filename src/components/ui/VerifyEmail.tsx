"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState("Verifying your email…");
  const [done, setDone] = useState(false);
  useEffect(() => {
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw new Error(result.error);
        setState(result.data.message);
        setDone(true);
      })
      .catch((e) => setState(e.message));
  }, [token]);
  return (
    <main className="center-page">
      <div className="status-card">
        {!done && <LoaderCircle className="spin" size={36} />}
        <h1>Email verification</h1>
        <p>{state}</p>
        <Link className="auth-submit" href="/login">
          Continue to sign in
        </Link>
      </div>
    </main>
  );
}
