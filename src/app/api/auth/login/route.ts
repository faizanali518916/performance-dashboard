import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User, UserStatus } from "@/lib/db/entities";
import { assertSameOrigin, clientIp, fail, HttpError, ok, parseBody } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/auth/crypto";
import { checkRateLimit, clearRateLimit } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = await parseBody(request, loginSchema);
    const key = `login:${clientIp(request)}:${input.email.toLowerCase()}`;
    await checkRateLimit(key);
    const db = await getDataSource();
    const user = await db
      .getRepository(User)
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("LOWER(user.email) = LOWER(:email)", { email: input.email })
      .getOne();
    if (!user || !(await verifyPassword(input.password, user.password)))
      throw new HttpError(401, "Invalid email or password");
    if (user.status !== UserStatus.ACTIVE) throw new HttpError(403, "This account is inactive");
    if (!user.emailVerified) throw new HttpError(403, "Verify your email before signing in");
    await createSession(user.id);
    await clearRateLimit(key);
    return ok({ message: "Signed in" });
  } catch (error) {
    return fail(error);
  }
}
