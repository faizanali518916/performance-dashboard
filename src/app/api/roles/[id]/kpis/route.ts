import { NextRequest } from "next/server";
import { AccessLevel, RoleKpiAssignment } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, requireAccess } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, ok, parseBody } from "@/lib/http";
import { assignKpiSchema } from "@/lib/validation";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    requireAccess(actor, AccessLevel.ADMIN, AccessLevel.MANAGER);
    const input = await parseBody(request, assignKpiSchema);
    const { id: roleId } = await params;
    const db = await getDataSource();
    await db
      .getRepository(RoleKpiAssignment)
      .upsert({ roleId, kpiId: input.kpiId, target: String(input.target) }, ["roleId", "kpiId"]);
    return ok({ message: "KPI assigned" }, 201);
  } catch (error) {
    return fail(error);
  }
}
