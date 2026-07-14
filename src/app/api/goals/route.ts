import { NextRequest } from "next/server";
import { Goal, GoalStatus } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, assertCanManageUser } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, ok, parseBody } from "@/lib/http";
import { goalSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const input = await parseBody(request, goalSchema);
    await assertCanManageUser(actor, input.userId);
    const row = await getDataSource().then((db) =>
      db.getRepository(Goal).save({ ...input, status: input.status as GoalStatus }),
    );
    return ok(row, 201);
  } catch (error) {
    return fail(error);
  }
}
