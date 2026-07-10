import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { AuthToken, AuthTokenPurpose, User } from "@/lib/db/entities";
import { randomToken, hashToken } from "@/lib/auth/crypto";
import { EmailDeliveryError, sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, fail, HttpError, ok, parseBody } from "@/lib/http";
import { forgotSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const route = "POST /api/auth/resend-verification";
  try {
    assertSameOrigin(request);
    await checkRateLimit(`resend-verification:${clientIp(request)}`, 4, 60);
    const { email } = await parseBody(request, forgotSchema);
    const db = await getDataSource();
    const user = await db.getRepository(User).findOneBy({ email: email.toLowerCase() });

    // Keep the response generic so this endpoint cannot be used to enumerate accounts.
    if (!user || user.emailVerified)
      return ok({ message: "If that account needs verification, a new email has been sent." });

    const token = randomToken();
    await db.getRepository(AuthToken).upsert(
      {
        userId: user.id,
        tokenHash: hashToken(token),
        purpose: AuthTokenPurpose.VERIFY_EMAIL,
        expiresAt: new Date(Date.now() + 24 * 3600000),
      },
      ["userId", "purpose"],
    );
    await sendVerificationEmail(user.email, token);
    return ok({ message: "If that account needs verification, a new email has been sent." });
  } catch (error) {
    if (error instanceof EmailDeliveryError) return fail(new HttpError(503, error.message), { route });
    return fail(error, { route });
  }
}
