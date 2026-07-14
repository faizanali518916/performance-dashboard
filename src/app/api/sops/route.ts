import { NextRequest } from "next/server";
import { In } from "typeorm";
import {
  apiUser,
  assertCanManageDepartment,
  getManagedDepartmentIds,
  requireAccess,
} from "@/lib/auth/authorize";
import { getDataSource } from "@/lib/db/data-source";
import { AccessLevel, Department, Sop } from "@/lib/db/entities";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { sopSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const actor = await apiUser(request);
    const db = await getDataSource();
    const departmentIds = actor.accessLevel === AccessLevel.ADMIN
      ? (await db.getRepository(Department).find({ select: { id: true } })).map((department) => department.id)
      : actor.accessLevel === AccessLevel.MANAGER
        ? await getManagedDepartmentIds(actor.id)
        : actor.departmentId ? [actor.departmentId] : [];
    const sops = departmentIds.length
      ? await db.getRepository(Sop).find({
          where: { departmentId: In(departmentIds) },
          relations: { department: true },
          order: { name: "ASC" },
        })
      : [];
    return ok(sops.map((sop) => ({
      id: sop.id,
      name: sop.name,
      description: sop.description,
      departmentId: sop.departmentId,
      departmentName: sop.department.name,
      updatedAt: sop.updatedAt,
    })));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    requireAccess(actor, AccessLevel.ADMIN, AccessLevel.MANAGER);
    const input = await parseBody(request, sopSchema);
    await assertCanManageDepartment(actor, input.departmentId);
    const db = await getDataSource();
    if (!(await db.getRepository(Department).findOneBy({ id: input.departmentId })))
      throw new HttpError(422, "Select a valid department");
    const duplicate = await db.getRepository(Sop).createQueryBuilder("sop")
      .where('sop."departmentId" = :departmentId', { departmentId: input.departmentId })
      .andWhere("LOWER(sop.name) = LOWER(:name)", { name: input.name })
      .getOne();
    if (duplicate) throw new HttpError(409, "An SOP with this name already exists in the department");
    const sop = await db.getRepository(Sop).save(input);
    return ok({ id: sop.id, message: "SOP created" }, 201);
  } catch (error) {
    return fail(error);
  }
}
