"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Gauge, LoaderCircle, Plus, UserPlus } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
export function AdminPanel({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const isAdmin = data.actor.accessLevel === "ADMIN";
  const manageableUsers = data.users.filter(
    (user) =>
      user.id !== data.actor.id &&
      (isAdmin ? user.accessLevel !== "ADMIN" : user.managerId === data.actor.id && user.accessLevel === "EMPLOYEE"),
  );
  const managers = data.users.filter((user) => user.accessLevel === "MANAGER");
  const [selectedUserId, setSelectedUserId] = useState(manageableUsers[0]?.id ?? "");
  const selectedUser = manageableUsers.find((user) => user.id === selectedUserId);
  async function submit(event: FormEvent<HTMLFormElement>, url: string, action: string, method = "POST") {
    event.preventDefault();
    if (pendingAction) return;
    setMessage("");
    setPendingAction(action);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body: Record<string, unknown> = {};
    form.forEach((v, k) => (body[k] = v || null));
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(result.data.message || "Saved successfully");
      formElement.reset();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setPendingAction(null);
    }
  }
  return (
    <>
      <div className="admin-grid">
        <form className="admin-card" onSubmit={(e) => submit(e, "/api/roles", "role")}>
          <div className="admin-icon purple">
            <BriefcaseBusiness />
          </div>
          <h3>Create a role</h3>
          <p>Define a job function for employees.</p>
          <label>
            Role title
            <input name="title" required placeholder="Amazon Account Manager" />
          </label>
          <button className="management-action" disabled={pendingAction !== null}>
            {pendingAction === "role" ? <LoaderCircle className="management-spinner" size={16} /> : <Plus size={16} />}
            Add role
          </button>
        </form>
        <form className="admin-card" onSubmit={(e) => submit(e, "/api/kpis", "kpi")}>
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
          <button className="management-action" disabled={pendingAction !== null}>
            {pendingAction === "kpi" ? <LoaderCircle className="management-spinner" size={16} /> : <Plus size={16} />}
            Add KPI
          </button>
        </form>
        <form
          className="admin-card"
          onSubmit={(e) =>
            submit(e, `/api/roles/${String(new FormData(e.currentTarget).get("roleId"))}/kpis`, "assignment")
          }
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
          <button className="management-action" disabled={pendingAction !== null}>
            {pendingAction === "assignment" ? (
              <LoaderCircle className="management-spinner" size={16} />
            ) : (
              <Plus size={16} />
            )}
            Assign KPI
          </button>
        </form>
        <form className="admin-card" onSubmit={(e) => submit(e, "/api/users", "employee")}>
          <div className="admin-icon blue">
            <UserPlus />
          </div>
          <h3>Add an employee</h3>
          <p>{isAdmin ? "Create an account and choose its reporting line." : "Create an employee for your team."}</p>
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
            {isAdmin && (
              <label>
                Manager
                <select name="managerId" defaultValue="">
                  <option value="">No manager</option>
                  {managers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {isAdmin && (
            <label>
              Access
              <select name="accessLevel" defaultValue="EMPLOYEE">
                <option>EMPLOYEE</option>
                <option>MANAGER</option>
              </select>
            </label>
          )}
          <input type="hidden" name="status" value="active" />
          <button className="management-action" disabled={pendingAction !== null}>
            {pendingAction === "employee" ? (
              <LoaderCircle className="management-spinner" size={16} />
            ) : (
              <UserPlus size={16} />
            )}
            Create employee
          </button>
        </form>
        <form
          className="admin-card"
          onSubmit={(event) => selectedUser && submit(event, `/api/users/${selectedUser.id}`, "update", "PATCH")}
        >
          <div className="admin-icon purple">
            <UserPlus />
          </div>
          <h3>Update an employee</h3>
          <p>
            {isAdmin ? "Change an employee’s role, manager, or access." : "Assign a role to one of your employees."}
          </p>
          {manageableUsers.length ? (
            <>
              <label>
                Employee
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                  {manageableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Role
                <select name="roleId" key={`${selectedUserId}-role`} defaultValue={selectedUser?.roleId} required>
                  {data.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
              </label>
              {isAdmin && (
                <div className="two-fields">
                  <label>
                    Manager
                    <select
                      name="managerId"
                      key={`${selectedUserId}-manager`}
                      defaultValue={selectedUser?.managerId ?? ""}
                    >
                      <option value="">No manager</option>
                      {managers
                        .filter((manager) => manager.id !== selectedUser?.id)
                        .map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Access
                    <select
                      name="accessLevel"
                      key={`${selectedUserId}-access`}
                      defaultValue={selectedUser?.accessLevel}
                    >
                      <option>EMPLOYEE</option>
                      <option>MANAGER</option>
                    </select>
                  </label>
                </div>
              )}
              <button className="management-action" disabled={pendingAction !== null}>
                {pendingAction === "update" ? (
                  <LoaderCircle className="management-spinner" size={16} />
                ) : (
                  <UserPlus size={16} />
                )}
                Save employee
              </button>
            </>
          ) : (
            <div className="inline-empty">No employees are available to update.</div>
          )}
        </form>
      </div>
      {message && <div className="toast-message">{message}</div>}
    </>
  );
}
