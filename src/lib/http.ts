import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { firstZodError } from "./validation";
import { logError, logWarn } from "./logger";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
export function fail(error: unknown, context: Record<string, unknown> = {}) {
  const requestId = typeof context.requestId === "string" ? context.requestId : crypto.randomUUID();
  if (error instanceof HttpError) {
    logWarn("API request rejected", { ...context, requestId, status: error.status, error: error.message });
    return NextResponse.json(
      { error: error.message, requestId },
      { status: error.status, headers: { "x-request-id": requestId } },
    );
  }
  logError("Unhandled API error", error, { ...context, requestId });
  return NextResponse.json(
    { error: "An unexpected error occurred", requestId },
    { status: 500, headers: { "x-request-id": requestId } },
  );
}
export async function parseBody<T>(request: NextRequest, schema: ZodSchema<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(422, firstZodError(result.error));
  return result.data;
}
export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) throw new HttpError(403, "Invalid request origin");
}
export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
