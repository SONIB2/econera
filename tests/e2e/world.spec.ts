import { expect, test } from "@playwright/test";

test("logo, door and masonry follow the immersive scene states", async ({ page, isMobile }, testInfo) => {
  test.slow();
  await page.goto("/");
  const world = page.locator(".immersive-world");
  await expect(world).toHaveAttribute("data-phase", "intro");
  const history = await world.evaluateHandle((element) => {
    const visited: (string | null)[] = [];
    const observer = new MutationObserver((records) => {
      visited.push(...records.map((record) => record.oldValue), element.getAttribute("data-phase"));
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-phase"], attributeOldValue: true });
    return { visited, observer };
  });
  await expect(page.locator(".world-canvas canvas")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("01-logo.png"), scale: "css" });
  await expect(page.getByRole("link", { name: "Shfleto katalogun" })).toHaveAttribute("href", "/materiale");
  const logo = page.getByRole("button", { name: /ECONERA.*Hyr/ });
  if (isMobile) await logo.tap();
  else {
    await logo.focus();
    await page.keyboard.press("Enter");
  }
  await expect(world).toHaveAttribute("data-phase", "portal", { timeout: 20_000 });
  await expect(world).toHaveAttribute("data-renderer", "ready");
  const canvas = page.locator(".world-canvas canvas");
  await expect(canvas).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: testInfo.outputPath("02-portal.png"), scale: "css" });

  const doorBounds = await canvas.boundingBox();
  if (!doorBounds) throw new Error("WebGL canvas not found");
  const doorX = doorBounds.x + doorBounds.width * .5;
  const doorY = doorBounds.y + doorBounds.height * .52;
  if (isMobile) await page.touchscreen.tap(doorX, doorY);
  else await page.mouse.click(doorX, doorY);
  await expect(world).toHaveAttribute("data-phase", "entering", { timeout: 15_000 });
  await page.screenshot({ path: testInfo.outputPath("03-door-opening.png"), scale: "css" });
  await expect(world).toHaveAttribute("data-phase", "house", { timeout: 15_000 });
  await expect(page).toHaveURL(/scene=house$/);
  await page.screenshot({ path: testInfo.outputPath("04-interior.png"), scale: "css" });
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("WebGL canvas not found");
  const wallX = bounds.x + bounds.width * .19;
  const wallY = bounds.y + bounds.height * .41;
  if (isMobile) await page.touchscreen.tap(wallX, wallY);
  else await page.mouse.click(wallX, wallY);
  await expect(page.getByRole("heading", { name: "Muratura" })).toBeFocused({ timeout: 10_000 });
  const visited = await history.evaluate(({ observer, visited }) => { observer.disconnect(); return visited.join(" "); });
  expect(visited).toMatch(/intro.*approaching.*portal.*opening.*entering.*house.*focusing.*masonry/);
  await expect(canvas).toHaveAttribute("data-masonry", "clay");
  await page.screenshot({ path: testInfo.outputPath("05-masonry.png"), scale: "css" });
  await page.getByRole("radio", { name: "Tullë me zgavra" }).check();
  await expect(page.getByRole("link", { name: "Hap studion e muraturës" })).toHaveAttribute("href", "/materiale/murature?tipi=hollow");
  await expect(canvas).toHaveAttribute("data-masonry", "hollow");
  await page.screenshot({ path: testInfo.outputPath("06-hollow-brick.png"), scale: "css" });
  await page.goBack();
  await expect(world).toHaveAttribute("data-phase", "house");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("World language switches preserve the camera destination and selected brick", async ({ page }) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const world = page.locator(".immersive-world");
  await page.goto("/?scene=masonry&tipi=block");
  await expect(world).toHaveAttribute("data-renderer", "ready", { timeout: 20_000 });
  await expect(page.getByRole("radio", { name: "Bllok murature betoni" })).toBeChecked();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(world).toHaveAttribute("data-renderer", "ready", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Masonry", exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Concrete masonry block" })).toBeChecked();
  await page.getByRole("radio", { name: "Reclaimed brick" }).check();
  await page.getByRole("link", { name: "Shqip", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "sq");
  await expect(world).toHaveAttribute("data-renderer", "ready", { timeout: 20_000 });
  await expect(page.getByRole("radio", { name: "Tullë e rikuperuar" })).toBeChecked();
});

test("reduced motion supports keyboard entry and exit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?scene=portal");
  await expect(page.getByRole("button", { name: "Hap derën" })).toBeFocused({ timeout: 20_000 });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Shiko murin e tullave" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Muratura" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/scene=house$/);
});

test("direct entry offers the catalogue without WebGL", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (args[0] === "webgl2") return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto("/?scene=house");
  await expect(page.getByRole("heading", { name: "Pamja 3D nuk u ngarkua." })).toBeVisible();
  await page.getByRole("link", { name: "Hap katalogun" }).click();
  await expect(page).toHaveURL(/\/materiale$/);
});
