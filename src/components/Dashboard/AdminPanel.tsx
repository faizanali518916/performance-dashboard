"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Gauge, Plus, UserPlus } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
export function AdminPanel({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>, url: string) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {};
    form.forEach((v, k) => (body[k] = v || null));
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(result.data.message || "Saved successfully");
      event.currentTarget.reset();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    }
  }
  return (
    <>
      <div className="admin-grid">
        <form className="admin-card" onSubmit={(e) => submit(e, "/api/roles")}>
          <div className="admin-icon purple">
            <BriefcaseBusiness />
          </div>
          <h3>Create a role</h3>
          <p>Define a job function for employees.</p>
          <label>
            Role title
            <input name="title" required placeholder="Amazon Account Manager" />
          </label>
          <button>
            <Plus size={16} /> Add role
          </button>
        </form>
        <form className="admin-card" onSubmit={(e) => submit(e, "/api/kpis")}>
          <div className="admin-icon teal">
            <Gauge />
          </div>
          <h3>Create a KPI</h3>
          <p>Define a measurable company metric.</p>
          <label>
            KPI name
            <input name="name" required placeholder="Revenue Generated" />
          </label>
          <div className="two-fields">
            <label>
              Unit
              <input name="unit" placeholder="PKR" />
            </label>
            <label>
              Description
              <input name="description" placeholder="Monthly revenue" />
            </label>
          </div>
          <button>
            <Plus size={16} /> Add KPI
          </button>
        </form>
        <form
          className="admin-card"
          onSubmit={(e) => submit(e, `/api/roles/${String(new FormData(e.currentTarget).get("roleId"))}/kpis`)}
        >
          <div className="admin-icon orange">
            <Gauge />
          </div>
          <h3>Assign KPI to role</h3>
          <p>Set the expected target for a job function.</p>
          <label>
            Role
            <select name="roleId" required defaultValue="">
              <option value="" disabled>
                Select role
              </option>
              {data.roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
          <div className="two-fields">
            <label>
              KPI
              <select name="kpiId" required defaultValue="">
                <option value="" disabled>
                  Select KPI
                </option>
                {data.kpis.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target
              <input type="number" name="target" min="0" step=".01" required />
            </label>
          </div>
          <button>
            <Plus size={16} /> Assign KPI
          </button>
        </form>
        <form className="admin-card" onSubmit={(e) => submit(e, "/api/users")}>
          <div className="admin-icon blue">
            <UserPlus />
          </div>
          <h3>Add an employee</h3>
          <p>Create a verified account and reporting line.</p>
          <div className="two-fields">
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
          </div>
          <label>
            Temporary password
            <input name="password" type="password" required minLength={10} />
          </label>
          <div className="two-fields">
            <label>
              Role
              <select name="roleId" required defaultValue="">
                <option value="" disabled>
                  Select role
                </option>
                {data.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Manager
              <select name="managerId" defaultValue="">
                <option value="">No manager</option>
                {data.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Access
            <select name="accessLevel" defaultValue="EMPLOYEE">
              <option>EMPLOYEE</option>
              <option>MANAGER</option>
              <option>ADMIN</option>
            </select>
          </label>
          <input type="hidden" name="status" value="active" />
          <button>
            <UserPlus size={16} /> Create employee
          </button>
        </form>
      </div>
      {message && <div className="toast-message">{message}</div>}
    </>
  );
}
