import type { NextConfig } from "next";

/**
 * Full policy, sent in report-only mode first: violations are posted to /api/csp-report and nothing is blocked.
 * Once the reports are clean on staging, the same string moves to the enforced Content-Security-Policy header.
 * 'unsafe-inline' scripts are needed for Next.js's inline bootstrap without per-request nonces; 'wasm-unsafe-eval'
 * lets the 3D loader decode compressed models.
 */
const CSP_FULL = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.gstatic.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob: data:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
].join("; ");

const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // Verification documents (PDF/photos) are uploaded through Server Actions; 15 MB files plus form fields.
  experimental: { serverActions: { bodySizeLimit: "16mb" } },
  // Old Vercel addresses and the bare domain move permanently to the official one (same path and query).
  async redirects() {
    return ["econera.vercel.app", "econera.al"].map((host) => ({
      source: "/:path*", has: [{ type: "host" as const, value: host }], destination: "https://www.econera.al/:path*", permanent: true,
    }));
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
        { key: "Content-Security-Policy-Report-Only", value: CSP_FULL },
      ],
    }];
  },
};

export default config;
