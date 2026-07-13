import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { AccessLevel, User, UserStatus } from "@/lib/db/entities";
import { apiUser, assertCanAccessUser, requireAccess } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { updateUserSchema } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const actor = await apiUser(request);
    const { id } = await context.params;
    await assertCanAccessUser(actor, id);
    const db = await getDataSource();
    const user = await db.getRepository(User).findOne({ where: { id }, relations: { role: true, manager: true } });
    if (!user) throw new HttpError(404, "User not found");
    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      managerId: user.managerId,
      managerName: user.manager?.name ?? null,
      status: user.status,
      accessLevel: user.accessLevel,
    });
  } catch (error) {
    return fail(error);
  }
}
export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const { id } = await context.params;
    const input = await parseBody(request, updateUserSchema);
    if (input.managerId === id) throw new HttpError(422, "A user cannot manage themselves");
    const db = await getDataSource();
    if (actor.accessLevel === AccessLevel.MANAGER) {
      await assertCanAccessUser(actor, id);
      if (id === actor.id || Object.keys(input).some((key) => key !== "roleId"))
        throw new HttpError(403, "Managers can only update roles for their employees");
      const result = await db.getRepository(User).update(id, { roleId: input.roleId });
      if (!result.affected) throw new HttpError(404, "User not found");
      return ok({ message: "User updated" });
    }
    requireAccess(actor, AccessLevel.ADMIN);
    if (input.accessLevel === AccessLevel.ADMIN) throw new HttpError(422, "Users cannot be made administrators here");
    if (input.managerId) {
      const manager = await db.getRepository(User).findOneBy({ id: input.managerId, accessLevel: AccessLevel.MANAGER });
      if (!manager) throw new HttpError(422, "Select a valid manager");
    }
    const update = {
      ...input,
      managerId: input.accessLevel === AccessLevel.MANAGER ? null : input.managerId,
      status: input.status as UserStatus | undefined,
      accessLevel: input.accessLevel as AccessLevel | undefined,
    };
    const result = await db.getRepository(User).update(id, update);
    if (!result.affected) throw new HttpError(404, "User not found");
    return ok({ message: "User updated" });
  } catch (error) {
    return fail(error);
  }
}
