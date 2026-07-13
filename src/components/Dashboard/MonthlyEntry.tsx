"use client";
import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardData } from "@/lib/dashboard";

type Employee = DashboardData["users"][number];

export function MonthlyEntry({
  employee,
  period,
  actor,
}: {
  employee: Employee;
  period: string;
  actor: DashboardData["actor"];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [entryType, setEntryType] = useState<"GOOD" | "BAD">("GOOD");
  const [journalText, setJournalText] = useState("");
  const rows = useMemo(
    () =>
      employee.assignments.map((a) => {
        const saved = employee.performance.find((p) => p.period === `${period}-01` && p.kpiId === a.kpiId);
        return { ...a, current: saved?.current ?? "", target: saved?.target ?? a.target };
      }),
    [employee, period],
  );
  const canAddJournal = actor.accessLevel !== "EMPLOYEE" && actor.id !== employee.id;

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
      const description = canAddJournal ? journalText.trim() : "";
      if (description)
        await api("/api/journals", {
          userId: employee.id,
          description,
          category: entryType,
          impact: Number(form.get("impact") || 10),
          period: `${period}-01`,
        });
      setJournalText("");
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
        <div className="entry-layout">
          <section className="entry-block">
            <div className="entry-panel-header">
              <div>
                <h3>📊 KPI results</h3>
                <p>Target vs actual</p>
              </div>
              <span>
                {rows.length} {rows.length === 1 ? "metric" : "metrics"}
              </span>
            </div>
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
          </section>
          <section className={`journal-entry-panel ${entryType === "GOOD" ? "good" : "bad"}`}>
            <div className="entry-panel-header">
              <div>
                <h3>{entryType === "GOOD" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} Journal entry</h3>
                <p>Record one reflection for this month</p>
              </div>
              {canAddJournal && <span>Optional</span>}
            </div>
            {canAddJournal ? (
              <>
                <div className="journal-entry-controls">
                  <label>
                    Type
                    <select value={entryType} onChange={(event) => setEntryType(event.target.value as "GOOD" | "BAD")}>
                      <option value="GOOD">Achievement</option>
                      <option value="BAD">Challenge</option>
                    </select>
                  </label>
                  <label>
                    Impact
                    <input name="impact" type="number" min="0" max="100" defaultValue="10" />
                  </label>
                </div>
                <textarea
                  className="journal-entry-textarea"
                  value={journalText}
                  onChange={(event) => setJournalText(event.target.value)}
                  placeholder={
                    entryType === "GOOD"
                      ? "What went especially well this month?"
                      : "What slowed progress or needs support?"
                  }
                />
                <small className="journal-entry-hint">You can add one achievement or challenge per save.</small>
              </>
            ) : (
              <div className="journal-entry-locked">
                Journal entries can only be added for a team member you manage.
              </div>
            )}
          </section>
        </div>
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
