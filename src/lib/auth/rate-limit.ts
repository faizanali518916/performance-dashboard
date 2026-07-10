import { getDataSource } from "@/lib/db/data-source";
import { AuthRateLimit } from "@/lib/db/entities";
import { HttpError } from "@/lib/http";

export async function checkRateLimit(key: string, maxAttempts = 5, windowMinutes = 15) {
  const db = await getDataSource();
  const repo = db.getRepository(AuthRateLimit);
  const now = new Date();
  const record = await repo.findOneBy({ key });
  if (record?.blockedUntil && record.blockedUntil > now)
    throw new HttpError(429, "Too many attempts. Please try again later.");
  const expired = !record || now.getTime() - record.windowStartedAt.getTime() > windowMinutes * 60000;
  const attempts = expired ? 1 : record.attempts + 1;
  const blockedUntil = attempts > maxAttempts ? new Date(now.getTime() + windowMinutes * 60000) : null;
  await repo.save({ key, attempts, windowStartedAt: expired ? now : record!.windowStartedAt, blockedUntil });
  if (blockedUntil) throw new HttpError(429, "Too many attempts. Please try again later.");
}
export async function clearRateLimit(key: string) {
  const db = await getDataSource();
  await db.getRepository(AuthRateLimit).delete({ key });
}
