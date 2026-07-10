import { AlertTriangle, Award } from "lucide-react";
type Entry = { id: string; description: string; category: "GOOD" | "BAD"; impact: number; period: string };
export function JournalTimeline({ entries, category }: { entries: Entry[]; category?: "GOOD" | "BAD" }) {
  const rows = category ? entries.filter((e) => e.category === category) : entries;
  if (!rows.length)
    return (
      <div className="empty-state">
        <span>{category === "BAD" ? "🌱" : "🏆"}</span>
        <h3>Nothing recorded yet</h3>
        <p>Monthly reflections will appear here.</p>
      </div>
    );
  return (
    <div className="timeline">
      {rows.map((entry) => (
        <article className={`timeline-item ${entry.category.toLowerCase()}`} key={entry.id}>
          <div className="timeline-icon">
            {entry.category === "GOOD" ? <Award size={19} /> : <AlertTriangle size={19} />}
          </div>
          <div>
            <div className="timeline-meta">
              <span>{entry.category === "GOOD" ? "Achievement" : "Challenge"}</span>
              <time>
                {new Date(`${entry.period}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </time>
            </div>
            <p>{entry.description}</p>
            <small>Impact {entry.impact}/100</small>
          </div>
        </article>
      ))}
    </div>
  );
}
