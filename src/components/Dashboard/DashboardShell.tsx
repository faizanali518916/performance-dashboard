"use client";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Gauge,
  LayoutDashboard,
  Settings2,
  TrendingUp,
  Users,
  ClipboardEdit,
  Target,
} from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import { Header } from "./Header";
import { PerformanceCard } from "./PerformanceCard";
import { PerformanceChart, KpiBarChart } from "./PerformanceChart";
import { KPICard } from "./KPICard";
import { JournalTimeline } from "./JournalTimeline";
import { JournalPanel } from "./JournalPanel";
import { MonthlyEntry } from "./MonthlyEntry";
import { TeamOverview } from "./TeamOverview";
import { AdminPanel } from "./AdminPanel";

type Tab = "overview" | "entry" | "journal" | "kpis" | "team" | "management";
export function DashboardShell({ data }: { data: DashboardData }) {
  const initialId = data.users.find((u) => u.id === data.actor.id)?.id || data.users[0]?.id;
  const [selectedId, setSelectedId] = useState(initialId);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [tab, setTab] = useState<Tab>("overview");
  const employee = data.users.find((u) => u.id === selectedId) || data.users[0];
  const selectableUsers =
    data.actor.accessLevel === "ADMIN"
      ? data.users
      : data.actor.accessLevel === "MANAGER"
        ? data.users.filter((user) => user.id === data.actor.id || user.managerId === data.actor.id)
        : data.users.filter((user) => user.id === data.actor.id);
  const stats = useMemo(() => (employee ? getStats(employee) : null), [employee]);
  if (!employee)
    return (
      <>
        <Header user={data.actor} />
        <main className="container">
          <div className="empty-state">
            <h2>No accessible employee records</h2>
            <p>Ask an administrator to configure your account.</p>
          </div>
        </main>
      </>
    );
  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; visible: boolean }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, visible: true },
    { id: "entry", label: "Monthly Entry", icon: ClipboardEdit, visible: data.actor.accessLevel !== "EMPLOYEE" },
    { id: "journal", label: "Journal", icon: ClipboardEdit, visible: true },
    { id: "kpis", label: "KPI Tracking", icon: Target, visible: true },
    { id: "team", label: "Team Overview", icon: Users, visible: data.actor.accessLevel !== "EMPLOYEE" },
    { id: "management", label: "Management", icon: Settings2, visible: data.actor.accessLevel !== "EMPLOYEE" },
  ];
  return (
    <div className="dashboard-page">
      <Header user={data.actor} />
      <main className="container">
        <section className="selector-bar">
          <label>
            <span>👤 Team member</span>
            <select value={employee.id} onChange={(e) => setSelectedId(e.target.value)}>
              {selectableUsers.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>📅 Reporting month</span>
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </label>
          <label>
            <span>Role & access</span>
            <div className="person-info">
              <strong>{employee.roleTitle}</strong>
              <small>{employee.accessLevel.toLowerCase()}</small>
            </div>
          </label>
        </section>
        <nav className="tabs" aria-label="Dashboard sections">
          {tabs
            .filter((t) => t.visible)
            .map((item) => (
              <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
        </nav>
        {tab === "overview" && stats && (
          <>
            <section className="dash-banner-grid">
              <PerformanceCard
                icon={Gauge}
                label="Overall score"
                value={`${stats.overall}%`}
                sub={`${stats.delta >= 0 ? "+" : ""}${stats.delta}% vs prior month`}
                theme="dash-banner-pink"
              />
              <PerformanceCard
                icon={Target}
                label="KPIs met"
                value={`${stats.met}/${stats.latest.length}`}
                sub={`${stats.latest.length ? Math.round((stats.met / stats.latest.length) * 100) : 0}% achievement rate`}
                theme="dash-banner-purple"
              />
              <PerformanceCard
                icon={TrendingUp}
                label="Growth trajectory"
                value={stats.delta > 2 ? "Rising" : stats.delta < -2 ? "Falling" : "Steady"}
                sub="Performance trend"
                theme="dash-banner-teal"
              />
              <PerformanceCard
                icon={CalendarDays}
                label="Journal entries"
                value={String(employee.journals.length)}
                sub="Achievements & challenges"
                theme="dash-banner-orange"
              />
            </section>
            <section className="dash-main-row">
              <article className="chart-card main">
                <div className="chart-head">
                  <div>
                    <h2>Performance Trend</h2>
                    <p>Monthly target achievement</p>
                  </div>
                  <div className="legend">
                    <span className="score-dot" />
                    Score <span className="target-dot" />
                    Target
                  </div>
                </div>
                <PerformanceChart data={stats.trend} />
              </article>
              <article className="chart-card">
                <div className="chart-head">
                  <div>
                    <h2>KPI Balance</h2>
                    <p>Latest period by metric</p>
                  </div>
                </div>
                <KpiBarChart
                  data={stats.latest.map((x) => ({ name: x.name, score: Math.round((x.current / x.target) * 100) }))}
                />
              </article>
            </section>
            <section className="dash-bottom-row">
              <article className="card">
                <div className="card-header compact">
                  <div>
                    <span className="section-eyebrow">LATEST MONTH</span>
                    <h2>KPI Overview</h2>
                  </div>
                  <button onClick={() => setTab("kpis")}>View all →</button>
                </div>
                {stats.latest.slice(0, 3).map((k) => (
                  <KPICard key={k.id} {...k} />
                ))}
                {!stats.latest.length && <div className="inline-empty">No performance has been recorded yet.</div>}
              </article>
              <article className="card">
                <div className="card-header compact">
                  <div>
                    <span className="section-eyebrow">RECENT ACTIVITY</span>
                    <h2>Journal</h2>
                  </div>
                  <button onClick={() => setTab("journal")}>View all →</button>
                </div>
                <JournalTimeline entries={employee.journals.slice(0, 4)} />
              </article>
            </section>
          </>
        )}
        {tab === "entry" && <MonthlyEntry employee={employee} period={period} actor={data.actor} />}{" "}
        {tab === "journal" && <JournalPanel employee={employee} />}{" "}
        {tab === "kpis" && (
          <section className="card">
            <div className="card-header">
              <div>
                <span className="section-eyebrow">MEASURABLE OUTCOMES</span>
                <h2>KPI Performance Tracking</h2>
                <p>Latest results against the targets assigned to {employee.roleTitle}.</p>
              </div>
            </div>
            <div className="kpi-grid">
              {stats?.latest.length
                ? stats.latest.map((k) => <KPICard key={k.id} {...k} />)
                : employee.assignments.map((a) => (
                    <KPICard key={a.id} name={a.name} unit={a.unit} current={0} target={a.target} />
                  ))}
            </div>
          </section>
        )}{" "}
        {tab === "team" && <TeamOverview users={data.users} actorId={data.actor.id} />}{" "}
        {tab === "management" && <AdminPanel data={data} />}
      </main>
    </div>
  );
}
function getStats(employee: DashboardData["users"][number]) {
  const periods = [...new Set(employee.performance.map((p) => p.period))].sort();
  const latestPeriod = periods.at(-1);
  const previousPeriod = periods.at(-2);
  const rows = (period?: string) => employee.performance.filter((p) => p.period === period);
  const average = (items: typeof employee.performance) =>
    items.length
      ? Math.round(items.reduce((s, p) => s + (p.target ? (p.current / p.target) * 100 : 0), 0) / items.length)
      : 0;
  const latest = rows(latestPeriod);
  const overall = average(latest);
  const previous = average(rows(previousPeriod));
  const trend = periods.map((period) => ({
    period: new Date(`${period}T00:00:00`).toLocaleDateString(undefined, { month: "short" }),
    score: average(rows(period)),
    target: 100,
  }));
  return {
    latest,
    overall,
    delta: previousPeriod ? overall - previous : 0,
    met: latest.filter((p) => p.current >= p.target).length,
    trend,
  };
}
