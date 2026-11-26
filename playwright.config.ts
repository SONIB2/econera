import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const previewURL = process.env.PLAYWRIGHT_PREVIEW_URL ? new URL(process.env.PLAYWRIGHT_PREVIEW_URL) : null;
if (previewURL && (previewURL.protocol !== "https:" || previewURL.username || previewURL.password)) {
  throw new Error("PLAYWRIGHT_PREVIEW_URL must be an HTTPS URL without credentials.");
}
const baseURL = previewURL?.origin ?? `http://127.0.0.1:${port}`;
const installedChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;

export default defineConfig({
  testDir: "./tests/e2e",
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL, trace: "retain-on-failure", channel: installedChannel, launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    args: ["--enable-unsafe-swiftshader", ...(process.env.CI && !installedChannel ? ["--use-angle=swiftshader"] : [])],
  } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    // Other engines run in CI (ALL_BROWSERS=1), where Playwright can download them.
    ...(process.env.ALL_BROWSERS ? [
      { name: "firefox", use: { ...devices["Desktop Firefox"] } },
      { name: "webkit", use: { ...devices["Desktop Safari"] } },
      { name: "iphone", use: { ...devices["iPhone 13"] } },
    ] : []),
  ],
  webServer: previewURL ? undefined : {
    command: `node ./node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    env: { APP_ORIGIN: baseURL, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" },
  },
});
