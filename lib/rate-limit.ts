import "server-only";

const hits = new Map<string, number[]>();

/**
 * Sliding-window limiter kept in memory. Each serverless instance has its own window, so this slows
 * abuse rather than enforcing a hard global quota; a shared store (e.g. Upstash Redis) is the upgrade path.
 */
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

/** Client address as set by the hosting proxy (Vercel overwrites both headers, so they cannot be spoofed there). */
export function clientIp(h: Headers) {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
