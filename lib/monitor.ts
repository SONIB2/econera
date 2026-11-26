import "server-only";

/**
 * Structured server logs (one JSON line each), visible in Vercel's runtime logs and forwarded to Sentry when
 * SENTRY_DSN is set. Callers pass only technical fields: never tokens, passwords, document contents or chat text.
 */
const SECRETISH = /(authorization|cookie|token|password|secret|key|email|phone|message|text|prompt|image)/i;

function clean(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([k]) => !SECRETISH.test(k)).map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 200) : v]));
}

export function logEvent(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", event, ...clean(data), at: new Date().toISOString() }));
}

export function logError(event: string, error: unknown, data: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: "error", event, error: message.slice(0, 300), ...clean(data), at: new Date().toISOString() }));
  void forward(event, message, clean(data));
}

/** Minimal Sentry envelope over HTTPS, so no SDK is bundled. Does nothing without SENTRY_DSN. */
async function forward(event: string, message: string, extra: Record<string, unknown>) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const u = new URL(dsn);
    const project = u.pathname.replace(/\//g, "");
    const id = crypto.randomUUID().replace(/-/g, "");
    const header = JSON.stringify({ event_id: id, dsn, sent_at: new Date().toISOString() });
    const payload = JSON.stringify({
      event_id: id, timestamp: Date.now() / 1000, platform: "node", level: "error", logger: event,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV, release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12),
      exception: { values: [{ type: event, value: message.slice(0, 300) }] }, extra,
    });
    await fetch(`${u.protocol}//${u.host}/api/${project}/envelope/?sentry_key=${u.username}&sentry_version=7`, {
      method: "POST", headers: { "content-type": "application/x-sentry-envelope" },
      body: `${header}\n${JSON.stringify({ type: "event" })}\n${payload}`, signal: AbortSignal.timeout(2000),
    });
  } catch { /* monitoring must never break a request */ }
}
