import type { Instrumentation } from "next";

/** Server-side exceptions from pages, route handlers and server actions go to the structured log (and Sentry if configured). */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError } = await import("./lib/monitor");
  logError("server.exception", error, { path: request.path.split("?")[0], method: request.method, route: context.routePath, kind: context.routeType });
};
