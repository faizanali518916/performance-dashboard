import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { MoreThan } from "typeorm";
import { getDataSource } from "@/lib/db/data-source";
import { Session, UserStatus } from "@/lib/db/entities";
import { hashToken, randomToken } from "./crypto";
import type { SessionUser } from "@/types/domain";

export const SESSION_COOKIE = "pgts_session";
const SESSION_DAYS = 14;

export async function createSession(userId: string) {
  const token = randomToken();
  const db = await getDataSource();
  const headerStore = await headers();
  await db.getRepository(Session).save({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000),
    userAgent: headerStore.get("user-agent")?.slice(0, 500) ?? null,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDataSource();
    await db.getRepository(Session).delete({ tokenHash: hashToken(token) });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDataSource();
  const session = await db.getRepository(Session).findOne({
    where: { tokenHash: hashToken(token), expiresAt: MoreThan(new Date()) },
    relations: { user: { role: true } },
  });
  if (!session || session.user.status !== UserStatus.ACTIVE) return null;
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    accessLevel: user.accessLevel,
    managerId: user.managerId,
    role: { id: user.role.id, title: user.role.title },
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
