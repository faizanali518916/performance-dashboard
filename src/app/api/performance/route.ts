import { NextRequest } from "next/server";
import { AccessLevel, UserKpiPerformance } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, assertCanAccessUser } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { performanceSchema } from "@/lib/validation";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const input = await parseBody(request, performanceSchema);
    await assertCanAccessUser(actor, input.userId);
    if (actor.accessLevel === AccessLevel.EMPLOYEE && input.userId !== actor.id)
      throw new HttpError(403, "Not permitted");
    const db = await getDataSource();
    await db
      .getRepository(UserKpiPerformance)
      .upsert({ ...input, current: String(input.current), target: String(input.target) }, [
        "userId",
        "kpiId",
        "period",
      ]);
    return ok({ message: "Performance saved" }, 201);
  } catch (error) {
    return fail(error);
  }
}
