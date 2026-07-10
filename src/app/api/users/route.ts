import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { AccessLevel, User, UserStatus } from "@/lib/db/entities";
import { apiUser, requireAccess } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { createUserSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth/crypto";
export async function GET(request: NextRequest) {
  try {
    const actor = await apiUser(request);
    const db = await getDataSource();
    const repo = db.getRepository(User);
    const where =
      actor.accessLevel === AccessLevel.ADMIN
        ? {}
        : actor.accessLevel === AccessLevel.MANAGER
          ? { managerId: actor.id }
          : { id: actor.id };
    const users = await repo.find({ where, relations: { role: true, manager: true }, order: { name: "ASC" } });
    return ok(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        managerId: u.managerId,
        managerName: u.manager?.name ?? null,
        role: { id: u.role.id, title: u.role.title },
        status: u.status,
        accessLevel: u.accessLevel,
        createdAt: u.createdAt,
      })),
    );
  } catch (error) {
    return fail(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    requireAccess(actor, AccessLevel.ADMIN);
    const input = await parseBody(request, createUserSchema);
    const db = await getDataSource();
    const email = input.email.toLowerCase();
    if (await db.getRepository(User).findOneBy({ email })) throw new HttpError(409, "Email is already in use");
    const user = await db.getRepository(User).save({
      name: input.name,
      email,
      password: await hashPassword(input.password),
      emailVerified: true,
      roleId: input.roleId,
      managerId: input.managerId ?? null,
      accessLevel: input.accessLevel as AccessLevel,
      status: input.status as UserStatus,
    });
    return ok({ id: user.id, name: user.name, email: user.email }, 201);
  } catch (error) {
    return fail(error);
  }
}
