// Loads staging settings and refuses to touch production.
import { readFileSync, existsSync } from "node:fs";

const PRODUCTION_REF = "vnyohwrrfqumixnmcwqp";

export function stagingEnv() {
  if (existsSync(".env.staging")) {
    for (const line of readFileSync(".env.staging", "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
  const url = process.env.STAGING_SUPABASE_URL, anon = process.env.STAGING_SUPABASE_PUBLISHABLE_KEY, secret = process.env.STAGING_SUPABASE_SECRET_KEY;
  if (!url || !anon || !secret) throw new Error("Set STAGING_SUPABASE_URL, STAGING_SUPABASE_PUBLISHABLE_KEY and STAGING_SUPABASE_SECRET_KEY (in .env.staging).");
  if (url.includes(PRODUCTION_REF)) throw new Error("Refusing to run: this is the PRODUCTION Supabase project.");
  if (process.env.STAGING_CONFIRM !== "econera-staging") throw new Error("Set STAGING_CONFIRM=econera-staging to confirm this is the staging project.");
  const inbox = process.env.STAGING_INBOX;
  if (!inbox || !/^[^@+\s]+@[^@\s]+$/.test(inbox)) throw new Error("Set STAGING_INBOX to a mailbox you own (e.g. you@gmail.com); test accounts use +aliases of it.");
  return { url, anon, secret, inbox, site: process.env.STAGING_SITE_URL ?? "https://econera-git-phase-2-tema-diplomece.vercel.app" };
}

/** you@gmail.com + "buyer" → you+econera-buyer@gmail.com */
export const alias = (inbox, role) => inbox.replace("@", `+econera-${role}@`);
