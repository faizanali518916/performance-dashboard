import { NextRequest } from "next/server";
import { apiUser, assertCanManageDepartment, requireAccess } from "@/lib/auth/authorize";
import { getDataSource } from "@/lib/db/data-source";
import { AccessLevel, Department, Sop } from "@/lib/db/entities";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { sopSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    requireAccess(actor, AccessLevel.ADMIN, AccessLevel.MANAGER);
    const { id } = await context.params;
    const input = await parseBody(request, sopSchema);
    const db = await getDataSource();
    const sop = await db.getRepository(Sop).findOneBy({ id });
    if (!sop) throw new HttpError(404, "SOP not found");
    await assertCanManageDepartment(actor, sop.departmentId);
    await assertCanManageDepartment(actor, input.departmentId);
    if (!(await db.getRepository(Department).findOneBy({ id: input.departmentId })))
      throw new HttpError(422, "Select a valid department");
    const duplicate = await db.getRepository(Sop).createQueryBuilder("sop")
      .where('sop."departmentId" = :departmentId', { departmentId: input.departmentId })
      .andWhere("LOWER(sop.name) = LOWER(:name)", { name: input.name })
      .andWhere("sop.id <> :id", { id })
      .getOne();
    if (duplicate) throw new HttpError(409, "An SOP with this name already exists in the department");
    await db.getRepository(Sop).update(id, input);
    return ok({ message: "SOP updated" });
  } catch (error) {
    return fail(error);
  }
}
