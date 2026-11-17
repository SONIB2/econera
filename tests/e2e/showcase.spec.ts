import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("switching languages preserves the showcase step and language metadata", async ({ page }) => {
  await page.goto("/sq/platform");
  await expect(page.locator("html")).toHaveAttribute("lang", "sq");
  await page.getByRole("link", { name: "Fillo demonstrimin" }).click();
  await expect(page.getByRole("heading", { name: "Hyr në ECONERA World" })).toBeVisible();
  await page.getByRole("link", { name: "Shqyrto lotin e materialit" }).click();
  await expect(page.getByRole("heading", { name: "Shqyrto lotin e materialit" })).toBeVisible();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/platform\?step=record#tour$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Review the material lot" })).toBeVisible();
  await expect(page.getByText("Demonstration data. This lot is unavailable for purchase.")).toBeVisible();
  await expect(page.locator("link[rel=alternate][hreflang=sq]")).toHaveAttribute("href", /\/sq\/platform$/);
  await expect(page.getByRole("link", { name: "Review the material lot" })).toHaveAttribute("aria-current", "step");
  await page.getByRole("link", { name: "Shqip", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "sq");
  await expect(page.getByRole("heading", { name: "Shqyrto lotin e materialit" })).toBeVisible();
});

test("anonymous evaluators can complete the read-only tour without database calls", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" || /\/rest\/v1\/|\/auth\/v1\//.test(request.url())) requests.push(request.url());
  });
  await page.goto("/en/platform");
  await page.getByRole("link", { name: "Start the tour" }).click();
  await expect(page.getByRole("heading", { name: "Enter ECONERA World" })).toBeVisible();
  const destinations = ["house", "material", "record", "project", "quote", "logistics", "order", "passport", "ai"];
  for (const destination of destinations) {
    await page.getByRole("link", { name: "Next step" }).click();
    await expect(page).toHaveURL(new RegExp(`step=${destination}#tour$`));
    await expect(page.locator(`[aria-current=step][href$="step=${destination}#tour"]`)).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Explore possibilities for ECONERA AI" })).toBeVisible();
  await expect(page.getByText("Planned", { exact: true })).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Finish the tour" }).click();
  await expect(page.getByRole("heading", { name: "From material to project" })).toBeVisible();
  expect(requests).toEqual([]);
});
