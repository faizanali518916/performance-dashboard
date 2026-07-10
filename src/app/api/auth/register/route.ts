import { NextRequest } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { AuthToken, AuthTokenPurpose, Role, User } from "@/lib/db/entities";
import { assertSameOrigin, clientIp, fail, HttpError, ok, parseBody } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { hashPassword, hashToken, randomToken } from "@/lib/auth/crypto";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { EmailDeliveryError, sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await checkRateLimit(`register:${clientIp(request)}`, 4, 60);
    const input = await parseBody(request, registerSchema);
    const db = await getDataSource();
    const email = input.email.toLowerCase();
    if (await db.getRepository(User).findOneBy({ email }))
      throw new HttpError(409, "An account with this email already exists");
    let role = await db.getRepository(Role).findOneBy({ title: "Team Member" });
    if (!role) role = await db.getRepository(Role).save({ title: "Team Member" });
    const user = await db
      .getRepository(User)
      .save({ name: input.name, email, password: await hashPassword(input.password), roleId: role.id });
    const token = randomToken();
    await db.getRepository(AuthToken).save({
      userId: user.id,
      tokenHash: hashToken(token),
      purpose: AuthTokenPurpose.VERIFY_EMAIL,
      expiresAt: new Date(Date.now() + 24 * 3600000),
    });
    await sendVerificationEmail(email, token);
    return ok({ message: "Registration successful. Check your email to verify your account." }, 201);
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return fail(
        new HttpError(503, `${error.message} Your account was created; use resend verification after fixing SMTP.`),
        {
          route: "POST /api/auth/register",
        },
      );
    }
    return fail(error, { route: "POST /api/auth/register" });
  }
}
