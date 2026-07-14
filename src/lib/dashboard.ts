import "server-only";
import { In } from "typeorm";
import { getDataSource } from "./db/data-source";
import { AccessLevel, Department, Goal, Journal, KpiDefinition, Role, RoleKpiAssignment, Sop, User, UserKpiPerformance } from "./db/entities";
import type { SessionUser } from "@/types/domain";
import { getManagedDepartmentIds } from "./auth/authorize";

export async function getDashboardData(actor: SessionUser) {
  const db = await getDataSource();
  const userRepo = db.getRepository(User);
  const managedDepartmentIds =
    actor.accessLevel === AccessLevel.MANAGER ? await getManagedDepartmentIds(actor.id) : [];
  const where = actor.accessLevel === AccessLevel.ADMIN
    ? {}
    : actor.accessLevel === AccessLevel.MANAGER && managedDepartmentIds.length
      ? [{ id: actor.id }, { departmentId: In(managedDepartmentIds) }]
      : { id: actor.id };
  const users = await userRepo.find({
    where,
    relations: { role: true, department: true, managedDepartments: true },
    order: { name: "ASC" },
  });
  const userIds = users.map((u) => u.id);
  const performances = userIds.length
    ? await db
        .getRepository(UserKpiPerformance)
        .find({ where: { userId: In(userIds) }, relations: { kpi: true }, order: { period: "ASC" } })
    : [];
  const journals = userIds.length
    ? await db
        .getRepository(Journal)
        .find({ where: { userId: In(userIds) }, order: { createdAt: "DESC" } })
    : [];
  const goals = userIds.length
    ? await db.getRepository(Goal).find({ where: { userId: In(userIds) }, order: { deadline: "ASC", createdAt: "DESC" } })
    : [];
  const canManage = actor.accessLevel === AccessLevel.ADMIN || actor.accessLevel === AccessLevel.MANAGER;
  const assignmentRoleIds = [...new Set(users.map((user) => user.roleId))];
  const assignments = await db.getRepository(RoleKpiAssignment).find({
    where: canManage ? {} : { roleId: In(assignmentRoleIds) },
    relations: { kpi: true, role: true },
    order: { role: { title: "ASC" }, kpi: { name: "ASC" } },
  });
  const roles = canManage
    ? await db.getRepository(Role).find({ relations: { nextRole: true }, order: { title: "ASC" } })
    : [];
  const kpis = canManage ? await db.getRepository(KpiDefinition).find({ order: { name: "ASC" } }) : [];
  const actorRole = await db.getRepository(Role).findOne({
    where: { id: actor.role.id },
    relations: { nextRole: true },
  });
  const nextRoleAssignments = actorRole?.nextRoleId
    ? await db.getRepository(RoleKpiAssignment).find({
        where: { roleId: actorRole.nextRoleId },
        relations: { kpi: true },
        order: { kpi: { name: "ASC" } },
      })
    : [];
  let departments: Department[] = [];
  if (actor.accessLevel === AccessLevel.ADMIN) {
    departments = await db.getRepository(Department).find({
      relations: { managers: true, members: true, sops: true },
      order: { name: "ASC" },
    });
  } else if (actor.accessLevel === AccessLevel.MANAGER && managedDepartmentIds.length) {
    departments = await db.getRepository(Department).find({
      where: { id: In(managedDepartmentIds) },
      relations: { managers: true, members: true, sops: true },
      order: { name: "ASC" },
    });
  } else if (actor.departmentId) {
    departments = await db.getRepository(Department).find({
      where: { id: actor.departmentId },
      relations: { managers: true, members: true, sops: true },
    });
  }
  const accessibleDepartmentIds = departments.map((department) => department.id);
  const sops = accessibleDepartmentIds.length
    ? await db.getRepository(Sop).find({
        where: { departmentId: In(accessibleDepartmentIds) },
        relations: { department: true },
        order: { name: "ASC" },
      })
    : [];

  return {
    actor,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      roleId: user.roleId,
      roleTitle: user.role.title,
      departmentId: user.departmentId,
      departmentName: user.department?.name ?? null,
      accessLevel: user.accessLevel,
      status: user.status,
      managedDepartments: user.managedDepartments.map((department) => ({ id: department.id, name: department.name })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
      goals: goals
        .filter((goal) => goal.userId === user.id)
        .map((goal) => ({
          id: goal.id,
          description: goal.description,
          deadline: goal.deadline.toISOString(),
          status: goal.status,
          remarks: goal.remarks,
          createdAt: goal.createdAt.toISOString(),
        })),
    })),
    roles: roles.map((role) => ({
      id: role.id,
      title: role.title,
      nextRoleId: role.nextRoleId,
      nextRoleTitle: role.nextRole?.title ?? null,
      employees: users
        .filter((user) => user.roleId === role.id)
        .map((user) => ({ id: user.id, name: user.name, email: user.email })),
      kpis: assignments
        .filter((assignment) => assignment.roleId === role.id)
        .map((assignment) => ({
          id: assignment.id,
          kpiId: assignment.kpiId,
          name: assignment.kpi.name,
          unit: assignment.kpi.unit,
          target: Number(assignment.target),
        })),
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    })),
    kpis: kpis.map((kpi) => ({
      id: kpi.id,
      name: kpi.name,
      description: kpi.description,
      unit: kpi.unit,
      roleAssignments: assignments
        .filter((assignment) => assignment.kpiId === kpi.id)
        .map((assignment) => ({
          id: assignment.id,
          roleId: assignment.roleId,
          roleTitle: assignment.role.title,
          target: Number(assignment.target),
        })),
      createdAt: kpi.createdAt.toISOString(),
      updatedAt: kpi.updatedAt.toISOString(),
    })),
    departments: departments.map((department) => ({
      id: department.id,
      name: department.name,
      managers: department.managers.map((manager) => ({ id: manager.id, name: manager.name, email: manager.email })),
      members: department.members.map((member) => ({ id: member.id, name: member.name, email: member.email })),
      sops: department.sops.map((sop) => ({ id: sop.id, name: sop.name })),
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    })),
    sops: sops.map((sop) => ({
      id: sop.id,
      name: sop.name,
      description: sop.description,
      departmentId: sop.departmentId,
      departmentName: sop.department.name,
      updatedAt: sop.updatedAt.toISOString(),
    })),
    nextRole: actorRole?.nextRole
      ? {
          id: actorRole.nextRole.id,
          title: actorRole.nextRole.title,
          kpis: nextRoleAssignments.map((assignment) => ({
            id: assignment.id,
            name: assignment.kpi.name,
            unit: assignment.kpi.unit,
            target: Number(assignment.target),
          })),
        }
      : null,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
