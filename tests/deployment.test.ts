import assert from "node:assert/strict";
import { test } from "node:test";
import { applicationOrigin, isPreview, supabaseSettings } from "../lib/deployment";

test("Vercel preview resolves its HTTPS origin and rejects local or privileged database configuration", (context) => {
  const keys = ["VERCEL", "VERCEL_ENV", "VERCEL_URL", "NETLIFY", "CONTEXT", "DEPLOY_PRIME_URL", "ECONERA_HOSTED", "ECONERA_PREVIEW", "APP_ORIGIN", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
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

test("Netlify builds use the deploy origin and runtime configuration rejects localhost", (context) => {
  for (const [key, value] of Object.entries({
    NETLIFY: "true",
    CONTEXT: "deploy-preview",
    DEPLOY_PRIME_URL: "https://deploy-preview-1--econera.netlify.app",
    APP_ORIGIN: "",
    ECONERA_HOSTED: "1",
    NEXT_PUBLIC_SUPABASE_URL: "https://preview-project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  })) {
    const original = process.env[key];
    context.after(() => {
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    });
    if (value) process.env[key] = value;
    else delete process.env[key];
  }
  assert.equal(isPreview(), true);
  assert.equal(applicationOrigin(), "https://deploy-preview-1--econera.netlify.app");
  assert.equal(supabaseSettings()?.url, "https://preview-project.supabase.co");
  delete process.env.NETLIFY;
  delete process.env.DEPLOY_PRIME_URL;
  assert.equal(supabaseSettings(), null);
  process.env.APP_ORIGIN = "https://deploy-preview-1--econera.netlify.app";
  assert.equal(supabaseSettings()?.url, "https://preview-project.supabase.co");
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://127.0.0.1:55321";
  assert.equal(supabaseSettings(), null);
});

test("Vercel production always uses the official domain, whatever APP_ORIGIN says", (context) => {
  const keys = ["VERCEL", "VERCEL_ENV", "VERCEL_URL", "APP_ORIGIN"];
  const previous = keys.map((key) => process.env[key]);
  context.after(() => keys.forEach((key, index) => { const v = previous[index]; if (v === undefined) delete process.env[key]; else process.env[key] = v; }));
  Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "production", VERCEL_URL: "econera-abc123.vercel.app", APP_ORIGIN: "https://econera.vercel.app" });
  assert.equal(applicationOrigin(), "https://www.econera.al");
  process.env.VERCEL_ENV = "preview";
  assert.equal(applicationOrigin(), "https://econera.vercel.app");
});
