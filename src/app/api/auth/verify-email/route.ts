import { NextRequest } from "next/server";
import { MoreThan } from "typeorm";
import { getDataSource } from "@/lib/db/data-source";
import { AuthToken, AuthTokenPurpose, User } from "@/lib/db/entities";
import { assertSameOrigin, fail, HttpError, ok, parseBody } from "@/lib/http";
import { tokenSchema } from "@/lib/validation";
import { hashToken } from "@/lib/auth/crypto";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = await parseBody(request, tokenSchema);
    const db = await getDataSource();
    const record = await db.getRepository(AuthToken).findOneBy({
      tokenHash: hashToken(input.token),
      purpose: AuthTokenPurpose.VERIFY_EMAIL,
      expiresAt: MoreThan(new Date()),
    });
    if (!record) throw new HttpError(400, "This verification link is invalid or expired");
    await db.transaction(async (tx) => {
      await tx.getRepository(User).update(record.userId, { emailVerified: true });
      await tx.getRepository(AuthToken).delete(record.id);
    });
    return ok({ message: "Email verified. You can now sign in." });
  } catch (error) {
    return fail(error);
  }
}
