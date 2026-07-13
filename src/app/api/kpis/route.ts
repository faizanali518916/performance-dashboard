import { NextRequest } from "next/server";
import { AccessLevel, KpiDefinition } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, requireAccess } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, ok, parseBody } from "@/lib/http";
import { createKpiSchema } from "@/lib/validation";
export async function GET(request: NextRequest) {
  try {
    await apiUser(request);
    const db = await getDataSource();
    return ok(await db.getRepository(KpiDefinition).find({ order: { name: "ASC" } }));
  } catch (error) {
    return fail(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    requireAccess(actor, AccessLevel.ADMIN, AccessLevel.MANAGER);
    const input = await parseBody(request, createKpiSchema);
    const db = await getDataSource();
    return ok(await db.getRepository(KpiDefinition).save(input), 201);
  } catch (error) {
    return fail(error);
  }
}
