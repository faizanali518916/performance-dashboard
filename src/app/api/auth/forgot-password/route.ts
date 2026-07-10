import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { AuthToken, AuthTokenPurpose, User } from "@/lib/db/entities";
import { assertSameOrigin, clientIp, fail, ok, parseBody } from "@/lib/http";
import { forgotSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { hashToken, randomToken } from "@/lib/auth/crypto";
import { sendPasswordResetEmail } from "@/lib/email";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await checkRateLimit(`forgot:${clientIp(request)}`, 4, 60);
    const input = await parseBody(request, forgotSchema);
    const db = await getDataSource();
    const user = await db
      .getRepository(User)
      .createQueryBuilder("user")
      .where("LOWER(user.email) = LOWER(:email)", { email: input.email })
      .getOne();
    if (user) {
      const token = randomToken();
      await db.getRepository(AuthToken).upsert(
        {
          userId: user.id,
          tokenHash: hashToken(token),
          purpose: AuthTokenPurpose.RESET_PASSWORD,
          expiresAt: new Date(Date.now() + 3600000),
        },
        ["userId", "purpose"],
      );
      await sendPasswordResetEmail(user.email, token);
    }
    return ok({ message: "If that account exists, a reset link has been sent." });
  } catch (error) {
    return fail(error);
  }
}
