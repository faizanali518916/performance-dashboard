import { NextRequest } from "next/server";
import { MoreThan } from "typeorm";
import { getDataSource } from "@/lib/db/data-source";
import { AuthToken, AuthTokenPurpose, Session, User } from "@/lib/db/entities";
import { assertSameOrigin, clientIp, fail, HttpError, ok, parseBody } from "@/lib/http";
import { resetSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { hashPassword, hashToken } from "@/lib/auth/crypto";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await checkRateLimit(`reset:${clientIp(request)}`, 5, 60);
    const input = await parseBody(request, resetSchema);
    const db = await getDataSource();
    const record = await db.getRepository(AuthToken).findOneBy({
      tokenHash: hashToken(input.token),
      purpose: AuthTokenPurpose.RESET_PASSWORD,
      expiresAt: MoreThan(new Date()),
    });
    if (!record) throw new HttpError(400, "This reset link is invalid or expired");
    await db.transaction(async (tx) => {
      await tx.getRepository(User).update(record.userId, { password: await hashPassword(input.password) });
      await tx.getRepository(AuthToken).delete({ userId: record.userId });
      await tx.getRepository(Session).delete({ userId: record.userId });
    });
    return ok({ message: "Password updated. Sign in with your new password." });
  } catch (error) {
    return fail(error);
  }
}
