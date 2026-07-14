import { NextRequest } from "next/server";
import { AccessLevel, KpiDefinition } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, requireAccess } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { updateKpiSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    requireAccess(actor, AccessLevel.ADMIN, AccessLevel.MANAGER);
    const input = await parseBody(request, updateKpiSchema);
    const { id } = await context.params;
    const db = await getDataSource();
    const result = await db.getRepository(KpiDefinition).update(id, input);
    if (!result.affected) throw new HttpError(404, "KPI not found");
    return ok({ message: "KPI updated" });
  } catch (error) {
    return fail(error);
  }
}
