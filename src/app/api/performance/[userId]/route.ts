import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { UserKpiPerformance } from "@/lib/db/entities";
import { apiUser, assertCanAccessUser } from "@/lib/auth/authorize";
import { fail, ok } from "@/lib/http";
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const actor = await apiUser(request);
    const { userId } = await params;
    await assertCanAccessUser(actor, userId);
    const db = await getDataSource();
    const rows = await db
      .getRepository(UserKpiPerformance)
      .find({ where: { userId }, relations: { kpi: true }, order: { period: "DESC", kpi: { name: "ASC" } } });
    return ok(rows);
  } catch (error) {
    return fail(error);
  }
}
