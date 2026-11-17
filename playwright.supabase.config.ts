import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";
const cli = process.env.SUPABASE_CLI ?? "supabase";
const status = parseEnv(execFileSync(cli, ["status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const api = new URL(status.API_URL ?? status.PROJECT_URL ?? "");
const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
if (!["127.0.0.1", "localhost"].includes(api.hostname) || api.protocol !== "http:" || !key) {
  throw new Error("The connected browser suite requires a local Supabase stack and its publishable key.");
}

export default defineConfig({
  testDir: "./tests/connected",
  workers: 1,
  timeout: 90_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL,
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000",
    url: baseURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_LOCAL_APP === "1",
    env: {
      APP_ORIGIN: baseURL,
      NEXT_PUBLIC_SUPABASE_URL: api.origin,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    },
    timeout: 90_000,
  },
});
