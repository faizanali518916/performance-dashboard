import { NextRequest } from "next/server";
import { Goal, GoalStatus } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, assertCanManageUser } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { updateGoalSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

async function findGoal(id: string) {
  const db = await getDataSource();
  const goal = await db.getRepository(Goal).findOneBy({ id });
  if (!goal) throw new HttpError(404, "Goal not found");
  return { db, goal };
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const { id } = await context.params;
    const input = await parseBody(request, updateGoalSchema);
    const { db, goal } = await findGoal(id);
    await assertCanManageUser(actor, goal.userId);
    await db.getRepository(Goal).update(id, { ...input, status: input.status as GoalStatus });
    return ok({ message: "Goal updated" });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const { id } = await context.params;
    const { db, goal } = await findGoal(id);
    await assertCanManageUser(actor, goal.userId);
    await db.getRepository(Goal).delete(id);
    return ok({ message: "Goal deleted" });
  } catch (error) {
    return fail(error);
  }
}
