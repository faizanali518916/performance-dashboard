import { NextRequest } from "next/server";
import { assertSameOrigin, fail, ok } from "@/lib/http";
import { destroySession } from "@/lib/auth/session";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await destroySession();
    return ok({ message: "Signed out" });
  } catch (error) {
    return fail(error);
  }
}
