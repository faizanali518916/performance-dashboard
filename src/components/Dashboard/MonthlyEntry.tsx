"use client";
import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardData } from "@/lib/dashboard";

type Employee = DashboardData["users"][number];
export function MonthlyEntry({ employee, period }: { employee: Employee; period: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const rows = useMemo(
    () =>
      employee.assignments.map((a) => {
        const saved = employee.performance.find((p) => p.period === `${period}-01` && p.kpiId === a.kpiId);
        return { ...a, current: saved?.current ?? "", target: saved?.target ?? a.target };
      }),
    [employee, period],
  );
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      for (const row of rows) {
        const value = form.get(`kpi-${row.kpiId}`);
        if (value === "" || value === null) continue;
        await api("/api/performance", {
          userId: employee.id,
          kpiId: row.kpiId,
          period: `${period}-01`,
          current: Number(value),
          target: row.target,
        });
      }
      const achievement = String(form.get("achievement") || "").trim();
      const challenge = String(form.get("challenge") || "").trim();
      const impact = Number(form.get("impact") || 10);
      if (achievement)
        await api("/api/journals", {
          userId: employee.id,
          description: achievement,
          category: "GOOD",
          impact,
          period: `${period}-01`,
        });
      if (challenge)
        await api("/api/journals", {
          userId: employee.id,
          description: challenge,
          category: "BAD",
          impact,
          period: `${period}-01`,
        });
      setMessage("Monthly performance saved.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save entry");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card monthly-card">
      <div className="card-header">
        <div>
          <span className="section-eyebrow">MONTHLY CHECK-IN</span>
          <h2>
            Entry for {new Date(`${period}-02`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <p>Capture target outcomes and the story behind the numbers.</p>
        </div>
        <span className="role-chip">{employee.roleTitle}</span>
      </div>
      <form onSubmit={save}>
        <div className="entry-block">
          <h3>
            📊 KPI results <span>Target vs actual</span>
          </h3>
          {rows.length ? (
            <div className="entry-kpis">
              {rows.map((row) => (
                <label key={row.kpiId}>
                  <span>
                    {row.name}
                    <small>
                      Target {row.target.toLocaleString()} {row.unit}
                    </small>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name={`kpi-${row.kpiId}`}
                    defaultValue={row.current}
                    placeholder="Actual"
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="inline-empty">No KPIs are assigned to this role yet. Ask an admin to configure them.</div>
          )}
        </div>
        <div className="reflection-grid">
          <label className="reflection good">
            <span>
              <CheckCircle2 size={18} /> Achievement
            </span>
            <textarea name="achievement" placeholder="What went especially well this month?" />
          </label>
          <label className="reflection bad">
            <span>
              <AlertTriangle size={18} /> Challenge or blocker
            </span>
            <textarea name="challenge" placeholder="What slowed progress or needs support?" />
          </label>
        </div>
        <label className="impact-field">
          Impact score <input name="impact" type="number" min="0" max="100" defaultValue="10" />
          <span>0–100</span>
        </label>
        {message && <div className="form-alert success">{message}</div>}
        <button className="btn-primary" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />} Save monthly entry
        </button>
      </form>
    </section>
  );
}
async function api(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
