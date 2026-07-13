import { NextRequest } from "next/server";
import { Journal, JournalCategory } from "@/lib/db/entities";
import { getDataSource } from "@/lib/db/data-source";
import { apiUser, assertCanAccessUser } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { journalSchema } from "@/lib/validation";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const input = await parseBody(request, journalSchema);
    if (actor.id === input.userId || actor.accessLevel === "EMPLOYEE")
      throw new HttpError(403, "Only managers and administrators can add journal entries for employees");
    await assertCanAccessUser(actor, input.userId);
    const db = await getDataSource();
    const row = await db
      .getRepository(Journal)
      .save({ ...input, category: input.category as JournalCategory, impact: String(input.impact) });
    return ok(row, 201);
  } catch (error) {
    return fail(error);
  }
}
