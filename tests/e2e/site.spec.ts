import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { cookie: "lang=en" } });

test("main navigation reaches every top-level page and marks it active", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop bar");
  await page.goto("/treg");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  for (const [name, path] of [["For Business", "/cmimet"], ["Our Partners", "/partneret"], ["About Us", "/rreth-nesh"], ["Contact", "/kontakt"]] as const) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
  }
  await nav.getByRole("button", { name: "Marketplace options" }).click();
  await expect(page.getByRole("link", { name: /Sell Materials/ }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await nav.getByRole("button", { name: "AI Tools" }).click();
  await expect(page.getByRole("link", { name: "Explore All AI Tools" })).toBeVisible();
});

test("mobile drawer opens accordions and closes on navigation", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile drawer");
  await page.goto("/cmimet");
  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.locator("#menu-celular");
  await drawer.getByRole("button", { name: "Marketplace" }).click();
  await drawer.getByRole("link", { name: /Buy Materials/ }).click();
  await expect(page).toHaveURL(/\/treg$/);
  await expect(drawer).toBeHidden();
});

test("pricing toggle switches between yearly and monthly prices from the shared config", async ({ page }) => {
  await page.goto("/cmimet");
  const start = page.locator("article", { has: page.getByRole("heading", { name: "Start", exact: true }) });
  await expect(start).toContainText("2,000");
  await expect(start).toContainText("Billed yearly: 24,000 ALL");
  await page.getByRole("radio", { name: "Monthly" }).click();
  await expect(start).toContainText("2,500");
  await expect(page.getByText("Prices are in ALL and exclude VAT.").first()).toBeVisible();
  const q = page.getByRole("button", { name: "Are prices inclusive of VAT?" });
  await expect(q).toHaveAttribute("aria-expanded", "false");
  await q.click();
  await expect(q).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("No. All prices are in ALL and exclude VAT.")).toBeVisible();
});

test("partner form validates required fields and never shows invented partners", async ({ page }) => {
  await page.goto("/partneret");
  await expect(page.getByText("Our first partners are joining during the Tirana pilot.")).toBeVisible();
  await page.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The application was not sent" })).toBeVisible();
});

test("footer legal links all open real pages", async ({ page, request }) => {
  await page.goto("/kontakt");
  const links = page.getByRole("navigation", { name: "Legal" }).getByRole("link");
  const hrefs = await links.evaluateAll((a) => a.map((x) => (x as HTMLAnchorElement).getAttribute("href")!));
  expect(hrefs).toEqual(["/privatesia", "/kushtet", "/cookies", "/qasshmeria", "/mbrojtja"]);
  for (const h of hrefs) expect((await request.get(h)).status()).toBe(200);
});

test("no page scrolls sideways on a 320px phone", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 720 }, extraHTTPHeaders: { cookie: "lang=en" } });
  const page = await ctx.newPage();
  for (const u of ["/cmimet", "/treg", "/partneret", "/kontakt", "/verify", "/ai/smartcut", "/shit"]) {
    await page.goto(u);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), u).toBeLessThanOrEqual(320);
  }
  await ctx.close();
});

test("private areas redirect guests to sign in", async ({ request }) => {
  for (const u of ["/verifikimi", "/paneli", "/inventari"]) {
    const r = await request.get(u, { maxRedirects: 0 });
    expect([302, 303, 307, 308], u).toContain(r.status());
  }
  expect((await request.post("/api/admin/prescreen", { data: {} })).status()).toBe(403);
});
