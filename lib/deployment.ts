import { isIP } from "node:net";

function configuredUrl(value: string | undefined) {
  try {
    const url = new URL(value ?? "");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function isHostedUrl(url: URL) {
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  return url.protocol === "https:" && host.includes(".") && !isIP(host)
    && !host.endsWith(".localhost") && !host.endsWith(".local") && !host.endsWith(".test");
}

export function applicationOrigin() {
  const vercelHost = process.env.VERCEL_URL;
  const url = configuredUrl(process.env.APP_ORIGIN
    ?? (vercelHost && process.env.VERCEL === "1" ? `https://${vercelHost}` : undefined)
    ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : undefined));
  return url && (process.env.VERCEL !== "1" || isHostedUrl(url)) ? url.origin : null;
}

export function isPreview() {
  return process.env.ECONERA_PREVIEW === "1" || process.env.VERCEL_ENV === "preview";
}

function isPublishableKey(key: string) {
  if (key.startsWith("sb_publishable_")) return true;
  try {
    const [header, payload, signature, extra] = key.split(".");
    return Boolean(header && payload && signature && !extra
      && JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role === "anon");
  } catch {
    return false;
  }
}

export function supabaseSettings() {
  const url = configuredUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !isPublishableKey(key)) return null;
  if (process.env.VERCEL === "1" && (!isHostedUrl(url) || !applicationOrigin())) return null;
  return { url: url.origin, key };
}
