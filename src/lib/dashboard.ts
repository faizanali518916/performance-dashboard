import "server-only";
import { In } from "typeorm";
import { getDataSource } from "./db/data-source";
import { AccessLevel, Journal, KpiDefinition, Role, RoleKpiAssignment, User, UserKpiPerformance } from "./db/entities";
import type { SessionUser } from "@/types/domain";

export async function getDashboardData(actor: SessionUser) {
  const db = await getDataSource();
  const userRepo = db.getRepository(User);
  const where =
    actor.accessLevel === AccessLevel.ADMIN
      ? {}
      : actor.accessLevel === AccessLevel.MANAGER
        ? [{ id: actor.id }, { managerId: actor.id }]
        : { id: actor.id };
  const users = await userRepo.find({ where, relations: { role: true }, order: { name: "ASC" } });
  const userIds = users.map((u) => u.id);
  const performances = userIds.length
    ? await db
        .getRepository(UserKpiPerformance)
        .find({ where: { userId: In(userIds) }, relations: { kpi: true }, order: { period: "ASC" } })
    : [];
  const journals = userIds.length
    ? await db
        .getRepository(Journal)
        .find({ where: { userId: In(userIds) }, order: { period: "DESC", createdAt: "DESC" } })
    : [];
  const assignments = await db
    .getRepository(RoleKpiAssignment)
    .find({ where: { roleId: In([...new Set(users.map((u) => u.roleId))]) }, relations: { kpi: true } });
  const canManage = actor.accessLevel === AccessLevel.ADMIN || actor.accessLevel === AccessLevel.MANAGER;
  const roles = canManage ? await db.getRepository(Role).find({ order: { title: "ASC" } }) : [];
  const kpis = canManage ? await db.getRepository(KpiDefinition).find({ order: { name: "ASC" } }) : [];

  return {
    actor,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleTitle: user.role.title,
      managerId: user.managerId,
      accessLevel: user.accessLevel,
      status: user.status,
      assignments: assignments
        .filter((a) => a.roleId === user.roleId)
        .map((a) => ({ id: a.id, kpiId: a.kpiId, name: a.kpi.name, unit: a.kpi.unit, target: Number(a.target) })),
      performance: performances
        .filter((p) => p.userId === user.id)
        .map((p) => ({
          id: p.id,
          kpiId: p.kpiId,
          name: p.kpi.name,
          unit: p.kpi.unit,
          period: p.period,
          current: Number(p.current),
          target: Number(p.target),
        })),
      journals: journals
        .filter((j) => j.userId === user.id)
        .map((j) => ({
          id: j.id,
          description: j.description,
          category: j.category,
          impact: Number(j.impact),
          period: j.period,
          createdAt: j.createdAt.toISOString(),
        })),
    })),
    roles: roles.map((r) => ({ id: r.id, title: r.title })),
    kpis: kpis.map((k) => ({ id: k.id, name: k.name, unit: k.unit })),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
