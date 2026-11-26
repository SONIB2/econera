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
  return url.protocol === "https:" && host.includes(".") && !/^\d+(\.\d+){3}$/.test(host) && !host.startsWith("[")
    && !host.endsWith(".localhost") && !host.endsWith(".local") && !host.endsWith(".test");
}

function isHosted() {
  return process.env.NETLIFY === "true" || process.env.ECONERA_HOSTED === "1" || process.env.VERCEL === "1";
}

/** The official public address. Production always uses it, so links, emails, sitemap and metadata never point at a vercel.app host. */
export const PRODUCTION_ORIGIN = "https://www.econera.al";

export function applicationOrigin() {
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_ORIGIN;
  const vercelHost = process.env.VERCEL_URL;
  const url = configuredUrl(process.env.APP_ORIGIN
    ?? (process.env.NETLIFY === "true" ? process.env.DEPLOY_PRIME_URL : undefined)
    ?? (vercelHost && process.env.VERCEL === "1" ? `https://${vercelHost}` : undefined)
    ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : undefined));
  return url && (!isHosted() || isHostedUrl(url)) ? url.origin : null;
}

export function isPreview() {
  return process.env.ECONERA_PREVIEW === "1" || process.env.VERCEL_ENV === "preview"
    || (process.env.NETLIFY === "true" && ["deploy-preview", "branch-deploy"].includes(process.env.CONTEXT ?? ""));
}

function isPublishableKey(key: string) {
  if (key.startsWith("sb_publishable_")) return true;
  try {
    const [header, payload, signature, extra] = key.split(".");
    return Boolean(header && payload && signature && !extra
      && JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role === "anon");
  } catch {
    return false;
  }
}

export function supabaseSettings() {
  const url = configuredUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !isPublishableKey(key)) return null;
  if (isHosted() && (!isHostedUrl(url) || !applicationOrigin())) return null;
  return { url: url.origin, key };
}
