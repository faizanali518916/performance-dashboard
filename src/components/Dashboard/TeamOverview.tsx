import type { DashboardData } from "@/lib/dashboard";
import { AlertCircle, ArrowUpRight, Medal } from "lucide-react";

export function TeamOverview({ users, actorId }: { users: DashboardData["users"]; actorId: string }) {
  const members = users
    .filter((u) => u.id !== actorId)
    .map((user) => ({ user, score: latestScore(user.performance) }))
    .sort((a, b) => b.score - a.score);
  const average = members.length ? Math.round(members.reduce((sum, x) => sum + x.score, 0) / members.length) : 0;
  return (
    <>
      <div className="team-summary">
        <article>
          <span>TEAM AVERAGE</span>
          <strong>{average}%</strong>
          <small>Across latest monthly results</small>
        </article>
        <article>
          <span>TOP PERFORMER</span>
          <strong>{members[0]?.user.name || "—"}</strong>
          <small>{members[0] ? `${members[0].score}% target achievement` : "No data yet"}</small>
        </article>
        <article>
          <span>REQUIRES ATTENTION</span>
          <strong>{members.filter((x) => x.score < 70).length}</strong>
          <small>Employees below 70%</small>
        </article>
      </div>
      <section className="card">
        <div className="card-header">
          <div>
            <span className="section-eyebrow">PEOPLE</span>
            <h2>Team performance</h2>
            <p>A clean view of your reporting line and current momentum.</p>
          </div>
        </div>
        {members.length ? (
          <div className="team-table-wrap">
            <table className="team-table">
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Role</th>
                  <th>Latest score</th>
                  <th>Status</th>
                  <th>KPIs recorded</th>
                </tr>
              </thead>
              <tbody>
                {members.map(({ user, score }, i) => (
                  <tr key={user.id}>
                    <td>
                      <div className="person-cell">
                        <span className="small-avatar">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)}
                        </span>
                        <strong>{user.name}</strong>
                        {i === 0 && <Medal size={16} />}
                      </div>
                    </td>
                    <td>{user.roleTitle}</td>
                    <td>
                      <strong>{score}%</strong>
                      <div className="micro-progress">
                        <span style={{ width: `${Math.min(100, score)}%` }} />
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${score >= 100 ? "great" : score >= 70 ? "good" : "low"}`}>
                        {score >= 100 ? "Excelling" : score >= 70 ? "On track" : "Attention"}
                      </span>
                    </td>
                    <td>
                      {user.performance.length}
                      <ArrowUpRight size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <AlertCircle />
            <h3>No direct reports yet</h3>
            <p>Assign team members from Admin settings.</p>
          </div>
        )}
      </section>
    </>
  );
}
function latestScore(performance: DashboardData["users"][number]["performance"]) {
  const latest = performance
    .map((p) => p.period)
    .sort()
    .at(-1);
  const rows = performance.filter((p) => p.period === latest);
  return rows.length
    ? Math.round(rows.reduce((sum, p) => sum + (p.target ? (p.current / p.target) * 100 : 0), 0) / rows.length)
    : 0;
}
