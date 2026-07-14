"use client";

import { FormEvent, useMemo, useState } from "react";
import { BookOpen, Building2, LoaderCircle, Pencil, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardData } from "@/lib/dashboard";

type Sop = DashboardData["sops"][number];

export function SopPanel({ data }: { data: DashboardData }) {
  const router = useRouter();
  const canEdit = data.actor.accessLevel !== "EMPLOYEE";
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState<Sop | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const visibleSops = useMemo(
    () => data.sops.filter((sop) => filter === "ALL" || sop.departmentId === filter),
    [data.sops, filter],
  );
  const editorOpen = editing !== null || isAdding;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(editing ? `/api/sops/${editing.id}` : "/api/sops", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          description: String(form.get("description") || ""),
          departmentId: String(form.get("departmentId") || ""),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(result.data.message);
      setEditing(null);
      setIsAdding(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save SOP");
    } finally {
      setBusy(false);
    }
  }

  function closeEditor() {
    if (busy) return;
    setEditing(null);
    setIsAdding(false);
  }

  return (
    <section className="card list-panel">
      <div className="card-header list-panel-header">
        <div>
          <span className="section-eyebrow">PROCESS LIBRARY</span>
          <h2>Standard Operating Procedures</h2>
          <p>Department-specific guidance, workflows, and working standards.</p>
        </div>
        {canEdit && data.departments.length > 0 && (
          <button className="btn-primary add-goal-button" type="button" onClick={() => setIsAdding(true)}>
            <Plus size={16} /> Add SOP
          </button>
        )}
      </div>
      {message && <div className="form-alert success">{message}</div>}
      {data.departments.length > 1 && (
        <div className="list-toolbar">
          <label>
            Department
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="ALL">All departments</option>
              {data.departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="sop-grid">
        {visibleSops.length ? visibleSops.map((sop) => (
          <article className="sop-card" key={sop.id}>
            <div className="sop-card-icon"><BookOpen size={20} /></div>
            <div className="sop-card-content">
              <div className="sop-card-heading">
                <h3>{sop.name}</h3>
                <span><Building2 size={12} /> {sop.departmentName}</span>
              </div>
              <p>{sop.description}</p>
              <small>Updated {new Date(sop.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</small>
            </div>
            {canEdit && (
              <div className="sop-card-actions">
                <button type="button" onClick={() => setEditing(sop)}><Pencil size={14} /> Edit</button>
              </div>
            )}
          </article>
        )) : (
          <div className="inline-empty">No SOPs are available for this department.</div>
        )}
      </div>

      {editorOpen && (
        <div className="journal-modal-backdrop" role="presentation" onMouseDown={closeEditor}>
          <form className="journal-edit-modal sop-modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
            <div className="journal-modal-header">
              <div>
                <span className="section-eyebrow">SOP EDITOR</span>
                <h3>{editing ? "Edit SOP" : "Add an SOP"}</h3>
                <p>Document a clear and reusable department process.</p>
              </div>
              <button className="journal-modal-close" type="button" disabled={busy} onClick={closeEditor} aria-label="Close editor"><X size={18} /></button>
            </div>
            <label>SOP name<input name="name" required minLength={2} maxLength={160} defaultValue={editing?.name} placeholder="Client onboarding" /></label>
            <label>Department<select name="departmentId" required defaultValue={editing?.departmentId ?? data.departments[0]?.id}>{data.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            <label>Description<textarea name="description" required minLength={3} maxLength={10000} defaultValue={editing?.description} placeholder="Describe the process, responsibilities, and expected outcome." /></label>
            <div className="journal-modal-actions">
              <button className="btn-secondary" type="button" disabled={busy} onClick={closeEditor}>Cancel</button>
              <button className="btn-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : editing ? <Save size={16} /> : <Plus size={16} />}{editing ? " Save changes" : " Add SOP"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
