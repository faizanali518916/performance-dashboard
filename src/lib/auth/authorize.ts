import { NextRequest } from "next/server";
import { MoreThan } from "typeorm";
import { getDataSource } from "@/lib/db/data-source";
import { AccessLevel, Session, User, UserStatus } from "@/lib/db/entities";
import { HttpError } from "@/lib/http";
import { hashToken } from "./crypto";
import { SESSION_COOKIE } from "./session";
import type { SessionUser } from "@/types/domain";

export async function apiUser(request: NextRequest): Promise<SessionUser> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) throw new HttpError(401, "Authentication required");
  const db = await getDataSource();
  const session = await db.getRepository(Session).findOne({
    where: { tokenHash: hashToken(token), expiresAt: MoreThan(new Date()) },
    relations: { user: { role: true } },
  });
  if (!session || session.user.status !== UserStatus.ACTIVE) throw new HttpError(401, "Session expired");
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    accessLevel: u.accessLevel,
    managerId: u.managerId,
    role: { id: u.role.id, title: u.role.title },
  };
}
export function requireAccess(user: SessionUser, ...levels: AccessLevel[]) {
  if (!levels.includes(user.accessLevel as AccessLevel))
    throw new HttpError(403, "You do not have permission to perform this action");
}
export async function canAccessUser(actor: SessionUser, targetId: string) {
  if (actor.id === targetId || actor.accessLevel === AccessLevel.ADMIN) return true;
  if (actor.accessLevel !== AccessLevel.MANAGER) return false;
  const db = await getDataSource();
  return !!(await db.getRepository(User).findOneBy({ id: targetId, managerId: actor.id }));
}
export async function assertCanAccessUser(actor: SessionUser, targetId: string) {
  if (!(await canAccessUser(actor, targetId))) throw new HttpError(403, "You cannot access this employee");
}
