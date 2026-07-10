"use client";
import { LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types/domain";
export function Header({ user }: { user: SessionUser }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <span className="header-kicker">
            <Sparkles size={14} /> PERFORMANCE GROWTH TRACKING SYSTEM
          </span>
          <h1>Performance Dashboard</h1>
          <p>Turn progress into momentum, one month at a time.</p>
        </div>
        <div className="user-actions">
          <div className="avatar">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role.title}</span>
          </div>
          <button onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}
