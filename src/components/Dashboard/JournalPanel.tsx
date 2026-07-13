"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { JournalTimeline } from "./JournalTimeline";
import type { DashboardData } from "@/lib/dashboard";

type Employee = DashboardData["users"][number];
type Entry = Employee["journals"][number];

export function JournalPanel({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await request(`/api/journals/entry/${editing.id}`, "PATCH", {
        description: String(form.get("description") || ""),
        category: String(form.get("category") || "GOOD"),
        impact: Number(form.get("impact")),
        period: `${String(form.get("period"))}-01`,
      });
      setEditing(null);
      setMessage("Journal entry updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update journal entry");
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: Entry) {
    if (!window.confirm("Delete this journal entry?")) return;
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/journals/entry/${entry.id}`, "DELETE");
      if (editing?.id === entry.id) setEditing(null);
      setMessage("Journal entry deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete journal entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <span className="section-eyebrow">REFLECTIONS & SUPPORT</span>
          <h2>Journal</h2>
          <p>Achievements and challenges for {employee.name}.</p>
        </div>
      </div>
      {editing && (
        <div className="journal-modal-backdrop" role="presentation" onMouseDown={() => !busy && setEditing(null)}>
          <form className="journal-edit-modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
            <div className="journal-modal-header">
              <div>
                <span className="section-eyebrow">JOURNAL EDITOR</span>
                <h3>Edit journal entry</h3>
                <p>Refine the note, type, impact, or reporting month.</p>
              </div>
              <button
                className="journal-modal-close"
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
                aria-label="Close editor"
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Entry
              <textarea name="description" defaultValue={editing.description} required minLength={3} />
            </label>
            <div className="two-fields">
              <label>
                Type
                <select name="category" defaultValue={editing.category}>
                  <option value="GOOD">Achievement</option>
                  <option value="BAD">Challenge</option>
                </select>
              </label>
              <label>
                Impact
                <input name="impact" type="number" min="0" max="100" defaultValue={editing.impact} required />
              </label>
            </div>
            <label>
              Month
              <input name="period" type="month" defaultValue={editing.period.slice(0, 7)} required />
            </label>
            <div className="journal-modal-actions">
              <button className="btn-secondary" type="button" disabled={busy} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary" type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />} Save changes
              </button>
            </div>
          </form>
        </div>
      )}
      {message && <div className="form-alert success">{message}</div>}
      <div className="journal-columns">
        <article className="journal-column">
          <h3>Achievements</h3>
          <JournalTimeline
            entries={employee.journals}
            category="GOOD"
            onEdit={(entry) => setEditing(employee.journals.find((journal) => journal.id === entry.id) ?? null)}
            onDelete={(entry) => {
              const journal = employee.journals.find((item) => item.id === entry.id);
              if (journal) void remove(journal);
            }}
          />
        </article>
        <article className="journal-column">
          <h3>Challenges</h3>
          <JournalTimeline
            entries={employee.journals}
            category="BAD"
            onEdit={(entry) => setEditing(employee.journals.find((journal) => journal.id === entry.id) ?? null)}
            onDelete={(entry) => {
              const journal = employee.journals.find((item) => item.id === entry.id);
              if (journal) void remove(journal);
            }}
          />
        </article>
      </div>
    </section>
  );
}

async function request(url: string, method: "PATCH" | "DELETE", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
