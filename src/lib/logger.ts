type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...("code" in error ? { code: error.code } : {}),
    };
  }
  return { value: error };
}

export function logError(message: string, error: unknown, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      error: serializeError(error),
      ...context,
    }),
  );
}

export function logWarn(message: string, context: LogContext = {}) {
  console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: "warn", message, ...context }));
}
