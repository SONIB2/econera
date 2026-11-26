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

/** Per-feature caps across the whole platform. Defaults keep the worst case near $11 a day and $110 a month at November 2026 prices. */
const DAILY_DEFAULTS = { room: 300, design: 60, voice: 3000, prescreen: 500 } as const;
const MONTHLY_DEFAULTS = { room: 3000, design: 600, voice: 30000, prescreen: 5000 } as const;
export type AiFeature = keyof typeof DAILY_DEFAULTS;

const cap = (kind: "DAILY" | "MONTHLY", feature: AiFeature) =>
  Number(process.env[`AI_${kind}_LIMIT_${feature.toUpperCase()}`]) || (kind === "DAILY" ? DAILY_DEFAULTS : MONTHLY_DEFAULTS)[feature];

/** Counts one call against a calendar-month window (UTC) and reports whether the month's cap is passed. */
async function monthLimited(key: string, max: number) {
  const now = new Date();
  const bucket = `rl:${key}:${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  const ttl = 32 * 24 * 60 * 60 * 1000;
  const count = (await shared(bucket, ttl)) ?? local(bucket, ttl);
  return count > max;
}

/**
 * Platform-wide spending guard for paid AI calls: AI_DISABLED=1 switches every AI feature off at once, then each
 * feature has a daily and a monthly cap (override with AI_DAILY_LIMIT_<FEATURE> / AI_MONTHLY_LIMIT_<FEATURE>).
 * Counts are shared across instances when Upstash is configured. Set a hard spending limit at each provider too.
 */
export async function aiBudgetExceeded(feature: AiFeature) {
  if (process.env.AI_DISABLED === "1") return true;
  if (await rateLimited(`ai:${feature}`, cap("DAILY", feature), 24 * 60 * 60 * 1000)) return true;
  return monthLimited(`ai:${feature}:month`, cap("MONTHLY", feature));
}

/** Current caps, for the health check (numbers only). */
export const aiCaps = () => Object.fromEntries((Object.keys(DAILY_DEFAULTS) as AiFeature[]).map((f) => [f, { day: cap("DAILY", f), month: cap("MONTHLY", f) }]));

/** Client address as set by the hosting proxy (Vercel overwrites both headers, so they cannot be spoofed there). */
export function clientIp(h: Headers) {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
