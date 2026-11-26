import "server-only";

/**
 * Request limits. With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, counters live in Redis and are
 * shared by every server instance (fixed windows). Without them, or if Redis is unreachable, each instance keeps
 * its own counters in memory, which slows abuse but is not a global quota.
 */
const memory = new Map<string, { n: number; until: number }>();

function local(key: string, windowMs: number) {
  const now = Date.now();
  const hit = memory.get(key);
  if (!hit || hit.until <= now) { memory.set(key, { n: 1, until: now + windowMs }); if (memory.size > 5000) memory.clear(); return 1; }
  hit.n += 1;
  return hit.n;
}

async function shared(key: string, windowMs: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify([["INCR", key], ["PEXPIRE", key, String(windowMs), "NX"]]), signal: AbortSignal.timeout(1500), cache: "no-store",
    });
    if (!res.ok) return null;
    const [first] = (await res.json()) as { result?: number }[];
    return typeof first?.result === "number" ? first.result : null;
  } catch {
    return null;
  }
}

/** True when `key` has been used more than `max` times in the current window. */
export async function rateLimited(key: string, max: number, windowMs: number) {
  const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  const count = (await shared(bucket, windowMs)) ?? local(bucket, windowMs);
  return count > max;
}

/** Whether limits are shared across instances (reported by the health check). */
export const sharedLimits = () => Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const DAILY_DEFAULTS = { room: 300, design: 60, voice: 3000, prescreen: 500 } as const;
export type AiFeature = keyof typeof DAILY_DEFAULTS;

/** Platform-wide daily cap per paid AI feature, so a spike cannot run up the provider bill. Override with AI_DAILY_LIMIT_<FEATURE>. */
export async function aiBudgetExceeded(feature: AiFeature) {
  const max = Number(process.env[`AI_DAILY_LIMIT_${feature.toUpperCase()}`]) || DAILY_DEFAULTS[feature];
  return rateLimited(`ai:${feature}`, max, 24 * 60 * 60 * 1000);
}

/** Client address as set by the hosting proxy (Vercel overwrites both headers, so they cannot be spoofed there). */
export function clientIp(h: Headers) {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
