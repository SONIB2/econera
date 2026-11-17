import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage search reaches catalogue and fits the viewport", async ({ page }) => {
  await page.goto("/tregimi");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Një jetë tjetër.");
  const hero = page.locator("#fillimi .story-art img");
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Kalo te përmbajtja" })).toBeFocused();
  await page.getByRole("link", { name: "Nis udhëtimin" }).click();
  await expect(page).toHaveURL(/#gjurma$/);
  await expect(page.getByRole("heading", { name: "Çdo pjesë mban një gjurmë." })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#fillimi .story-art")).toHaveCSS("animation-name", "none");
  await page.getByRole("textbox", { name: "Kërko materiale" }).fill("parket");
  await page.getByRole("button", { name: "Kërko", exact: true }).click();
  await expect(page).toHaveURL(/materiale\?q=parket/);
  await expect(page.getByLabel("Titulli").first()).toHaveValue("parket");
  await expect(page.getByRole("heading", { name: "Katalogu nuk është i lidhur ende" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("construction story ends with a rotatable pavilion that can be shared", async ({ page, isMobile }) => {
  await page.goto("/tregimi");
  await page.getByRole("link", { name: "Nis udhëtimin" }).click();
  await page.getByRole("link", { name: "Ndiq materialet" }).click();
  await expect(page).toHaveURL(/#rindertimi$/);
  await page.getByRole("link", { name: "Krijo pavijonin" }).click();
  await expect(page).toHaveURL(/#pavijoni$/);
  const builder = page.locator("#pavijoni");
  await expect(builder.getByRole("heading", { name: "Pavijoni yt." })).toBeVisible();

  const model = builder.locator(".pavilion-model");
  await builder.getByRole("button", { name: "Rrotullo djathtas" }).click();
  await expect(model).toHaveAttribute("style", /13deg/);
  await builder.getByRole("button", { name: "Rikthe këndin fillestar" }).click();
  await expect(model).toHaveAttribute("style", /-32deg/);
  if (!isMobile) {
    const canvas = builder.locator(".pavilion-canvas");
    await canvas.scrollIntoViewIfNeeded();
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error("Pavilion canvas is missing");
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y, { steps: 4 });
    await page.mouse.up();
    await expect(model).toHaveAttribute("style", /--angle:\s*1deg/);
  }
  if (isMobile) {
    await builder.getByText("Dru", { exact: true }).tap();
    await builder.getByText("Muzg", { exact: true }).tap();
    await builder.getByText("Dy pjerrësi", { exact: true }).tap();
  } else {
    await builder.getByRole("radio", { name: "Tullë" }).focus();
    await page.keyboard.press("ArrowRight");
    await builder.getByRole("radio", { name: "Agim" }).focus();
    await page.keyboard.press("ArrowRight");
    await builder.getByRole("radio", { name: "E rrafshët" }).focus();
    await page.keyboard.press("ArrowRight");
  }
  await expect(builder.locator(".pavilion-stage")).toHaveAttribute("data-finish", "dru");
  await expect(builder.locator(".pavilion-stage")).toHaveAttribute("data-light", "muzg");
  await expect(builder.locator(".pavilion-stage")).toHaveAttribute("data-roof", "dy-pjerresi");
  await expect(builder.locator(".model-slope")).toHaveCount(2);
  await expect(builder.getByRole("link", { name: "Shiko materialin" })).toHaveAttribute("href", "/materiale?category=dru");
  await builder.getByRole("button", { name: "Kopjo lidhjen" }).click();
  const share = builder.getByLabel("Lidhja e pavijonit");
  await expect(share).toHaveValue(new RegExp(`\\?material=dru&drita=muzg&catia=dy-pjerresi&kendi=${isMobile ? "-32" : "1"}#pavijoni$`));
  const url = await share.inputValue();
  await page.goto(url);
  await expect(builder.getByRole("radio", { name: "Dru" })).toBeChecked();
  await expect(builder.getByRole("radio", { name: "Muzg" })).toBeChecked();
  await expect(builder.getByRole("radio", { name: "Dy pjerrësi" })).toBeChecked();
  await expect(model).toHaveAttribute("style", new RegExp(`--angle:\\s*${isMobile ? "-32" : "1"}deg`));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("all five Explorer controls reveal the matching catalogue filters", async ({ page }) => {
  await page.goto("/tregimi");
  const panel = page.locator("#zone-panel");
  const labels = [
    ["Muret", "Tulla dhe muraturë", "guri"],
    ["Dyshemeja", "Dru dhe parket", "dru"],
    ["Themelet", "Beton", "beton"],
    ["Hapjet", "Dritare dhe xham", "xham"],
    ["Çatia", "Çati dhe mbulim", "cati"],
  ] as const;
  for (const [part, title, category] of labels) {
    await page.getByRole("button", { name: part, exact: true }).click();
    await expect(page.locator(".scene")).toHaveAttribute("data-engaged", "true");
    await expect(panel.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Hap katalogun" })).toHaveAttribute("href", `/materiale?category=${category}`);
  }
  const hotspot = page.getByRole("button", { name: "Eksploro Beton" });
  await hotspot.focus();
  await page.keyboard.press("Enter");
  await expect(hotspot).toHaveAttribute("aria-pressed", "true");
  await expect(panel.getByRole("heading", { name: "Beton", exact: true })).toBeVisible();
  await panel.getByRole("link", { name: "Hap katalogun" }).click();
  await expect(page.getByLabel("Kategoria")).toHaveValue("beton");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/tregimi");
  expect(await page.locator("#pjeset button").evaluateAll((buttons) => buttons.every((button) => button.scrollWidth <= button.clientWidth))).toBe(true);
});

test("masonry studio swaps its visual and specifications with keyboard and touch", async ({ page, isMobile }) => {
  await page.goto("/tregimi");
  await page.getByRole("button", { name: "Eksploro Tulla dhe muraturë" }).click();
  await page.getByRole("link", { name: "Hap studion e muraturës" }).click();
  await expect(page.getByRole("heading", { name: "Studio e muraturës" })).toBeVisible();
  const types = page.getByRole("navigation", { name: "Tipet e muraturës" });
  const illustration = page.getByRole("img", { name: /Mur ilustrues/ });
  const options = [
    ["Tullë me zgavra", "hollow", "Drejtimi i zgavrave"],
    ["Tullë e rikuperuar", "reclaimed", "Prejardhja e lotit"],
    ["Bllok murature betoni", "block", "Pesha dhe forma e bllokut"],
    ["Tullë argjile e plotë", "clay", "Thithja e ujit"],
  ] as const;
  for (const [name, id, technical] of options) {
    const option = types.getByRole("link", { name });
    if (isMobile) await option.tap();
    else {
      await option.focus();
      await page.keyboard.press("Enter");
    }
    await expect(option).toHaveAttribute("aria-current", "page");
    await expect(illustration).toHaveAttribute("src", new RegExp(`masonry(?:%2F|/)${id}\\.webp`));
    await expect.poll(() => illustration.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByText(technical, { exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByText(/Pamje ilustruese/)).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(violations).toEqual([]);
});

test("protected inventory redirects and disconnected login explains the unavailable state", async ({ page }) => {
  await page.goto("/paneli/organizatat");
  await expect(page).toHaveURL(/\/hyr\?status=unavailable$/);
  await page.goto("/inventari");
  await expect(page).toHaveURL(/\/hyr\?status=unavailable$/);
  await expect(page.getByRole("status")).toHaveText("Shërbimi nuk është konfiguruar ende.");
  await expect(page.getByRole("button", { name: "Hyr", exact: true })).toBeDisabled();
  await page.getByRole("link", { name: "Harrove fjalëkalimin?" }).click();
  await expect(page.getByRole("heading", { name: "Rikthe hyrjen" })).toBeVisible();
});

test("public routes pass axe rules for WCAG AA", async ({ page }) => {
  for (const route of ["/", "/materiale", "/hyr", "/regjistrohu", "/fjalekalimi"]) {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations, route).toEqual([]);
  }
});
