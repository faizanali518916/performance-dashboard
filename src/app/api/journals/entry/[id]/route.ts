import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { Journal, JournalCategory } from "@/lib/db/entities";
import { apiUser, assertCanAccessUser } from "@/lib/auth/authorize";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { updateJournalSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

async function getJournal(id: string) {
  const db = await getDataSource();
  const journal = await db.getRepository(Journal).findOneBy({ id });
  if (!journal) throw new HttpError(404, "Journal entry not found");
  return { db, journal };
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const { id } = await context.params;
    const input = await parseBody(request, updateJournalSchema);
    const { db, journal } = await getJournal(id);
    await assertCanAccessUser(actor, journal.userId);
    await db
      .getRepository(Journal)
      .update(id, { ...input, category: input.category as JournalCategory, impact: String(input.impact) });
    return ok({ message: "Journal entry updated" });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const actor = await apiUser(request);
    const { id } = await context.params;
    const { db, journal } = await getJournal(id);
    await assertCanAccessUser(actor, journal.userId);
    await db.getRepository(Journal).delete(id);
    return ok({ message: "Journal entry deleted" });
  } catch (error) {
    return fail(error);
  }
}
