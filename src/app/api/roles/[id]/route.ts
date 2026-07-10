import { NextRequest } from "next/server";
import { AccessLevel, Role } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, requireAccess } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { updateRoleSchema } from "@/lib/validation";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    requireAccess(actor, AccessLevel.ADMIN);
    const input = await parseBody(request, updateRoleSchema);
    const { id } = await params;
    const db = await getDataSource();
    const result = await db.getRepository(Role).update(id, input);
    if (!result.affected) throw new HttpError(404, "Role not found");
    return ok({ message: "Role updated" });
  } catch (error) {
    return fail(error);
  }
}
