import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { AccessLevel, Role } from "@/lib/db/entities";
import { apiUser, requireAccess } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { createRoleSchema } from "@/lib/validation";
export async function GET(request: NextRequest) {
  try {
    await apiUser(request);
    const db = await getDataSource();
    return ok(
      await db.getRepository(Role).find({ relations: { kpiAssignments: { kpi: true } }, order: { title: "ASC" } }),
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
    const input = await parseBody(request, createRoleSchema);
    const db = await getDataSource();
    if (await db.getRepository(Role).findOneBy({ title: input.title })) throw new HttpError(409, "Role already exists");
    return ok(await db.getRepository(Role).save(input), 201);
  } catch (error) {
    return fail(error);
  }
}
