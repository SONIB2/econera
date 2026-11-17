import assert from "node:assert/strict";
import { test } from "node:test";
import { applicationOrigin, isPreview, supabaseSettings } from "../lib/deployment";

test("Vercel preview resolves its HTTPS origin and rejects local or privileged database configuration", (context) => {
  const keys = ["VERCEL", "VERCEL_ENV", "VERCEL_URL", "ECONERA_PREVIEW", "APP_ORIGIN", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = keys.map((key) => process.env[key]);
  context.after(() => keys.forEach((key, index) => {
    const value = previous[index];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }));
  keys.forEach((key) => delete process.env[key]);
  Object.assign(process.env, {
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_URL: "econera-preview.vercel.app",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  });
  assert.equal(isPreview(), true);
  assert.equal(applicationOrigin(), "https://econera-preview.vercel.app");
  assert.equal(supabaseSettings(), null);

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://preview-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_test";
  assert.equal(supabaseSettings(), null);
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  assert.equal(supabaseSettings()?.url, "https://preview-project.supabase.co");
  process.env.APP_ORIGIN = "http://127.0.0.1:3000";
  assert.equal(applicationOrigin(), null);
  assert.equal(supabaseSettings(), null);

  delete process.env.VERCEL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:55321";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = `header.${Buffer.from('{"role":"anon"}').toString("base64url")}.signature`;
  assert.equal(supabaseSettings()?.url, "http://127.0.0.1:55321");
});
