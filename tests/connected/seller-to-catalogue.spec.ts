import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type APIRequestContext, type Page } from "@playwright/test";

const mailpit = "http://127.0.0.1:55324";
const password = "Ec0nera-local-" + randomUUID();
type MessageSummary = { ID: string; Subject: string; To: { Address: string }[] };

async function confirmationLink(request: APIRequestContext, email: string, recovery = false) {
  let messageId = "";
  await expect.poll(async () => {
    const response = await request.get(`${mailpit}/api/v1/search`, { params: { query: `to:${email}` } });
    if (!response.ok()) return false;
    const body: { messages?: MessageSummary[] } = await response.json();
    messageId = body.messages?.find((message) => message.To.some(({ Address }) => Address === email) &&
      (!recovery || /reset/i.test(message.Subject)))?.ID ?? "";
    return Boolean(messageId);
  }, { message: "Mailpit should receive a confirmation for the new account", timeout: 15_000 }).toBe(true);

  const response = await request.get(`${mailpit}/api/v1/message/${encodeURIComponent(messageId)}`);
  if (!response.ok()) throw new Error("Mailpit could not read the confirmation message.");
  const body: { HTML?: string; Text?: string } = await response.json();
  for (const match of `${body.HTML ?? ""} ${body.Text ?? ""}`.matchAll(/https?:\/\/[^\s<>"')\]]+/g)) {
    const url = new URL(match[0].replaceAll("&amp;", "&"));
    if (["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname === "/auth/v1/verify" &&
        (!recovery || url.searchParams.get("type") === "recovery")) return url.href;
  }
  throw new Error("The confirmation email did not contain a local Supabase verification link.");
}

async function register(page: Page, request: APIRequestContext, email: string) {
  await page.goto("/regjistrohu");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Fjalëkalimi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Regjistrohu", exact: true }).click();
  await expect(page).toHaveURL(/\/regjistrohu\?status=email$/);
  await page.goto(await confirmationLink(request, email));
  await expect(page).toHaveURL(/\/paneli$/);
}

test("verified seller, moderator, and anonymous visitor see the correct listing states", async ({ page: seller, browser, request, baseURL }) => {
  const code = randomUUID();
  const sellerEmail = `seller-${code}@example.com`;
  const adminEmail = `moderator-${code}@example.com`;
  const title = `Parket prove ${code}`;
  const search = `/materiale?${new URLSearchParams({ q: title, region: "Fier", currency: "EUR" })}`;
  const adminContext = await browser.newContext({ baseURL });
  const visitorContext = await browser.newContext({ baseURL });

  try {
    const admin = await adminContext.newPage();
    const visitor = await visitorContext.newPage();
    await register(seller, request, sellerEmail);
    await register(admin, request, adminEmail);

    await seller.getByRole("link", { name: "Profili yt" }).click();
    await seller.getByLabel("Emri i profilit").fill("Shitës prove");
    await seller.getByLabel("Qarku (opsional)").selectOption("Fier");
    await seller.getByRole("button", { name: "Ruaj profilin" }).click();
    await expect(seller.getByRole("status")).toHaveText("Ndryshimet u ruajtën.");
    await seller.reload();
    await expect(seller.getByLabel("Emri i profilit")).toHaveValue("Shitës prove");
    await admin.goto("/inventari/profili");
    await expect(admin.getByLabel("Emri i profilit")).toHaveValue("");
    await visitor.goto("/inventari/profili");
    await expect(visitor).toHaveURL(/\/hyr$/);

    const cli = process.env.SUPABASE_CLI ?? "supabase";
    execFileSync(cli, ["db", "query",
      `insert into public.platform_admins (user_id) select id from auth.users where email = '${adminEmail}' and email_confirmed_at is not null`,
    ], { stdio: "pipe" });

    await seller.goto("/administrim");
    await expect(seller.getByRole("heading", { name: "Faqja nuk u gjet" })).toBeVisible();
    await seller.goto("/inventari/i-ri");
    await seller.getByLabel("Titulli").fill(title);
    await seller.getByLabel("Përshkrimi").fill("Material prove për rrjedhën lokale të publikimit.");
    await seller.getByLabel("Kategoria").selectOption("dru");
    await seller.getByLabel("Qarku").selectOption("Fier");
    await seller.getByLabel("Gjendja").selectOption("unused");
    await seller.getByLabel("Marrja e materialit").selectOption("pickup");
    await seller.getByLabel("Sasia", { exact: true }).fill("20,5");
    await seller.getByLabel("Njësia").selectOption("m²");
    await seller.getByLabel("Çmimi për njësi").fill("15");
    await seller.getByLabel("Monedha").selectOption("EUR");
    await seller.getByRole("button", { name: "Ruaj skicën" }).click();

    const sellerCard = seller.getByRole("article").filter({ has: seller.getByRole("heading", { name: title }) });
    await expect(sellerCard.getByText("Skicë", { exact: true })).toBeVisible();
    const privatePath = await sellerCard.getByRole("link", { name: `Ndrysho: ${title}` }).getAttribute("href");
    if (!privatePath) throw new Error("The draft did not have an edit link.");
    await admin.goto(privatePath);
    await expect(admin.getByRole("heading", { name: "Faqja nuk u gjet" })).toBeVisible();
    await visitor.goto(search);
    await expect(visitor.getByRole("heading", { name: "Nuk u gjetën materiale" })).toBeVisible();

    await sellerCard.getByRole("button", { name: "Dërgo për shqyrtim" }).click();
    await expect(sellerCard.getByText("Në shqyrtim", { exact: true })).toBeVisible();
    await visitor.reload();
    await expect(visitor.getByRole("heading", { name: "Nuk u gjetën materiale" })).toBeVisible();

    await admin.goto("/administrim");
    const review = admin.getByRole("article").filter({ has: admin.getByRole("heading", { name: title }) });
    await review.getByRole("button", { name: "Mirato dhe publiko" }).click();
    await expect(admin.getByRole("status")).toHaveText("Ndryshimet u ruajtën.");

    await visitor.goto("/tregimi");
    await visitor.getByRole("button", { name: "Dyshemeja", exact: true }).click();
    await expect(visitor.locator("#zone-panel").getByRole("link", { name: title, exact: true })).toBeVisible();
    await seller.goto("/tregimi");
    await seller.getByRole("button", { name: "Çatia", exact: true }).click();
    await seller.getByRole("link", { name: "Kërko disponueshmëri" }).click();
    await expect(seller.getByLabel("Kategoria")).toHaveValue("cati");
    const requestDetails = `Tjegulla për projektin e provës ${code}`;
    await seller.getByLabel("Çfarë të nevojitet?").fill(requestDetails);
    await seller.getByRole("button", { name: "Ruaj kërkesën" }).click();
    await expect(seller.getByText(requestDetails, { exact: true })).toBeVisible();
    await admin.goto("/disponueshmeria");
    await expect(admin.getByText(requestDetails, { exact: true })).toHaveCount(0);
    await admin.goto("/inventari");
    await admin.getByRole("button", { name: "Dil nga llogaria" }).click();
    await expect(admin).toHaveURL(/\/hyr$/);
    await admin.goto("/disponueshmeria?category=cati");
    await admin.getByRole("link", { name: "Hyr për të vazhduar" }).click();
    await admin.getByLabel("Email", { exact: true }).fill(adminEmail);
    await admin.getByLabel("Fjalëkalimi", { exact: true }).fill(password);
    await admin.getByRole("button", { name: "Hyr", exact: true }).click();
    await expect(admin).toHaveURL(/\/disponueshmeria\?category=cati$/);
    await expect(admin.getByText(requestDetails, { exact: true })).toHaveCount(0);

    await visitor.goto(search);
    await visitor.getByRole("link", { name: title, exact: true }).click();
    await expect(visitor.getByRole("heading", { name: title, level: 1 })).toBeVisible();

    await seller.goto("/inventari");
    await expect(sellerCard.getByText("Publikuar", { exact: true })).toBeVisible();
    await sellerCard.getByRole("button", { name: "Tërhiq" }).click();
    await expect(sellerCard.getByText("Skicë", { exact: true })).toBeVisible();

    await visitor.reload();
    await expect(visitor.getByRole("heading", { name: "Faqja nuk u gjet" })).toBeVisible();
    await visitor.goto(search);
    await expect(visitor.getByRole("heading", { name: "Nuk u gjetën materiale" })).toBeVisible();

    await sellerCard.getByRole("button", { name: "Arkivo" }).click();
    await expect(sellerCard.getByText("Arkivuar", { exact: true })).toBeVisible();
    await seller.getByLabel("Gjendja e publikimit").selectOption("published");
    await seller.getByRole("button", { name: "Kërko", exact: true }).click();
    await expect(sellerCard).toHaveCount(0);
    await seller.getByLabel("Gjendja e publikimit").selectOption("archived");
    await seller.getByRole("button", { name: "Kërko", exact: true }).click();
    await expect(sellerCard.getByText("Arkivuar", { exact: true })).toBeVisible();
  } finally {
    await Promise.all([adminContext.close(), visitorContext.close()]);
  }
});

test("masonry selection uses approved inventory and delivers a quotation to its seller", async ({ page: seller, browser, request, baseURL }, testInfo) => {
  test.slow();
  const code = randomUUID();
  const sellerEmail = `masonry-seller-${code}@example.com`;
  const buyerEmail = `masonry-buyer-${code}@example.com`;
  const title = `Tullë prove ${code}`;
  const sellerName = "Muratura e Provës";
  const message = `Ju lutem dërgoni ofertë dhe përmasat e tullave. Prova ${code}`;
  const buyerContext = await browser.newContext({ baseURL });
  const visitorContext = await browser.newContext({ baseURL });
  const mobileContext = await browser.newContext({ ...devices["Pixel 7"], baseURL });

  try {
    const buyer = await buyerContext.newPage();
    const visitor = await visitorContext.newPage();
    await register(seller, request, sellerEmail);
    await register(buyer, request, buyerEmail);
    execFileSync(process.env.SUPABASE_CLI ?? "supabase", ["db", "query",
      `insert into public.platform_admins (user_id) select id from auth.users where email = '${buyerEmail}' and email_confirmed_at is not null`,
    ], { stdio: "pipe" });

    await seller.goto("/inventari/i-ri");
    await seller.getByLabel("Titulli").fill(title);
    await seller.getByLabel("Përshkrimi").fill("Tulla me zgavra të provës për studion e muraturës.");
    await seller.getByLabel("Kategoria").selectOption("guri");
    await seller.getByLabel(/Tipi i muraturës/).selectOption("hollow");
    await seller.getByLabel(/Emri publik i shitësit/).fill(sellerName);
    await seller.getByLabel("Qarku").selectOption("Durrës");
    await seller.getByLabel("Gjendja").selectOption("unused");
    await seller.getByLabel("Marrja e materialit").selectOption("both");
    await seller.getByLabel("Sasia", { exact: true }).fill("200");
    await seller.getByLabel("Njësia").selectOption("copë");
    await seller.getByLabel("Çmimi për njësi").fill("2");
    await seller.getByLabel("Monedha").selectOption("EUR");
    await seller.getByRole("button", { name: "Ruaj skicën" }).click();
    const listing = seller.getByRole("article").filter({ has: seller.getByRole("heading", { name: title }) });
    await listing.getByRole("button", { name: "Dërgo për shqyrtim" }).click();

    await visitor.goto("/");
    await visitor.getByRole("button", { name: /ECONERA.*Hyr/ }).click();
    await visitor.getByRole("button", { name: "Hap derën" }).click();
    await visitor.getByRole("button", { name: "Shiko murin e tullave" }).click();
    await visitor.getByRole("link", { name: "Hap studion e muraturës" }).click();
    await visitor.getByRole("link", { name: "Tullë me zgavra" }).click();
    await expect(visitor.getByRole("link", { name: title, exact: true })).toHaveCount(0);

    await buyer.goto("/administrim");
    await buyer.getByRole("article").filter({ has: buyer.getByRole("heading", { name: title }) })
      .getByRole("button", { name: "Mirato dhe publiko" }).click();
    await expect(buyer.getByRole("status")).toHaveText("Ndryshimet u ruajtën.");

    const mobile = await mobileContext.newPage();
    for (const [page, touch] of [[visitor, false], [mobile, true]] as const) {
      await page.goto("/");
      await page.getByRole("button", { name: /ECONERA.*Hyr/ }).click();
      const world = page.locator(".immersive-world");
      const canvas = page.locator(".world-canvas canvas");
      await expect(world).toHaveAttribute("data-phase", "portal", { timeout: 20_000 });
      const bounds = await canvas.boundingBox();
      if (!bounds) throw new Error("WebGL canvas not found");
      const hit = (x: number, y: number) => touch
        ? page.touchscreen.tap(bounds.x + bounds.width * x, bounds.y + bounds.height * y)
        : page.mouse.click(bounds.x + bounds.width * x, bounds.y + bounds.height * y);
      await hit(.5, .52);
      await expect(world).toHaveAttribute("data-phase", "house", { timeout: 15_000 });
      await hit(.19, .41);
      const masonry = page.getByRole("complementary", { name: "Muratura" });
      await masonry.getByRole("radio", { name: "Tullë me zgavra" }).check({ timeout: 15_000 });
      const liveRow = masonry.getByRole("listitem").filter({ has: page.getByRole("link", { name: title, exact: true }) });
      await expect(liveRow).toContainText(sellerName);
      await expect(liveRow).toContainText("200 copë");
      await expect(liveRow).toContainText("Durrës");
      await expect(liveRow).toContainText("Tërheqje ose dërgesë");
      const link = liveRow.getByRole("link", { name: `Kërko ofertë për ${title}` });
      await expect(link).toBeVisible();
      await link.scrollIntoViewIfNeeded();
      await expect(canvas).toHaveAttribute("data-masonry", "hollow");
      await page.screenshot({ path: testInfo.outputPath(touch ? "mobile-live-inventory.png" : "desktop-live-inventory.png"), scale: "css" });
      if (touch) {
        await link.click();
        await expect(page.getByRole("link", { name: "Hyr për të vazhduar" })).toBeVisible();
      }
    }
    await visitor.getByRole("link", { name: "Hap studion e muraturës" }).click();
    await expect(visitor).toHaveURL(/\/materiale\/murature\?tipi=hollow$/);
    const stockRow = visitor.getByRole("listitem").filter({ has: visitor.getByRole("link", { name: title, exact: true }) });
    await expect(stockRow).toContainText(sellerName);
    await expect(stockRow).toContainText("200 copë");
    await expect(stockRow).toContainText("Durrës");
    await expect(stockRow).toContainText("Tërheqje ose dërgesë");
    await visitor.getByRole("link", { name: "Tullë argjile e plotë" }).click();
    await expect(visitor.getByRole("link", { name: title, exact: true })).toHaveCount(0);
    await visitor.getByRole("link", { name: "Tullë me zgavra" }).click();
    await stockRow.getByRole("link", { name: title, exact: true }).click();
    await expect(visitor.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await visitor.getByRole("link", { name: "Kërko ofertë" }).click();
    await visitor.getByRole("link", { name: "Hyr për të vazhduar" }).click();
    await visitor.getByLabel("Email", { exact: true }).fill(buyerEmail);
    await visitor.getByLabel("Fjalëkalimi", { exact: true }).fill(password);
    await visitor.getByRole("button", { name: "Hyr", exact: true }).click();
    await expect(visitor).toHaveURL(/\/materiale\/[0-9a-f-]+\/oferte$/);
    await visitor.getByLabel("Sasia (copë)").fill("201");
    await visitor.getByLabel("Marrja e materialit").selectOption("delivery");
    await visitor.getByLabel("Mesazh për shitësin").fill(message);
    await visitor.getByRole("button", { name: "Dërgo kërkesën" }).click();
    await expect(visitor.getByRole("status")).toContainText("Kërkesa nuk mund të dërgohet");
    await visitor.getByLabel("Sasia (copë)").fill("40");
    await visitor.getByLabel("Marrja e materialit").selectOption("delivery");
    await visitor.getByLabel("Mesazh për shitësin").fill(message);
    await visitor.getByRole("button", { name: "Dërgo kërkesën" }).click();
    await expect(visitor.getByRole("status")).toHaveText("Kërkesa u dërgua te shitësi.");
    await expect(visitor.getByText(message, { exact: true })).toBeVisible();
    await seller.goto("/inventari/ofertat");
    const received = seller.getByRole("article").filter({ hasText: message });
    await expect(received).toContainText("MARRË");
    await expect(received).toContainText("40 copë");
    await seller.goto("/inventari");
    await listing.getByRole("button", { name: "Arkivo" }).click();
    await expect(listing.getByText("Arkivuar", { exact: true })).toBeVisible();
  } finally {
    await Promise.all([buyerContext.close(), visitorContext.close(), mobileContext.close()]);
  }
});

test("verified accounts create a company, join by invitation, and recover a password", async ({ page: owner, browser, request, baseURL }) => {
  const suffix = randomUUID();
  const ownerEmail = `company-${suffix}@example.com`;
  const memberEmail = `team-${suffix}@example.com`;
  const organizationName = `Organizatë prove ${suffix}`;
  const memberContext = await browser.newContext({ baseURL });
  try {
    const member = await memberContext.newPage();
    await register(owner, request, ownerEmail);
    await expect(owner.getByRole("heading", { name: "Paneli ECONERA" })).toBeVisible();
    await owner.getByRole("link", { name: "Organizatat", exact: true }).click();
    await owner.getByLabel("Emri i organizatës").fill(organizationName);
    await owner.getByLabel("Qarku (opsional)").selectOption("Fier");
    await owner.getByRole("button", { name: "Krijo organizatën" }).click();
    await expect(owner).toHaveURL(/\/paneli\/organizatat\/[0-9a-f-]+\?status=organization-created$/, { timeout: 15_000 });
    await expect(owner.getByRole("heading", { name: organizationName })).toBeVisible();
    await expect(owner.getByText("Fier · Pronar")).toBeVisible();
    const organizationPath = new URL(owner.url()).pathname;
    await owner.getByLabel("Emaili i të ftuarit").fill(memberEmail);
    await owner.getByRole("button", { name: "Gjenero kodin" }).click();
    await expect(owner.getByRole("status", { name: "" }).filter({ hasText: "Kodi i ftesës u krijua." })).toBeVisible();
    const invitation = await owner.getByLabel("Kodi për ta ndarë").inputValue();

    await register(member, request, memberEmail);
    await member.goto(organizationPath);
    await expect(member.getByRole("heading", { name: "Faqja nuk u gjet" })).toBeVisible();
    await member.goto("/paneli/organizatat");
    await member.getByLabel("Kodi i ftesës").fill(invitation);
    await member.getByRole("button", { name: "Prano ftesën" }).click();
    await expect(member.getByRole("heading", { name: organizationName })).toBeVisible();
    await expect(member.getByText("Fier · Anëtar")).toBeVisible();
    await expect(member.getByRole("button", { name: "Gjenero kodin" })).toHaveCount(0);
    await member.reload();
    await expect(member.getByRole("heading", { name: organizationName })).toBeVisible();

    await member.getByRole("button", { name: "Dil nga llogaria" }).click();
    await expect(member).toHaveURL(/\/hyr$/);
    await member.goto("/fjalekalimi");
    await member.getByLabel("Email", { exact: true }).fill(memberEmail);
    await member.getByRole("button", { name: "Dërgo lidhjen" }).click();
    await expect(member).toHaveURL(/\/fjalekalimi\?status=email$/);
    await member.goto(await confirmationLink(request, memberEmail, true));
    await expect(member).toHaveURL(/\/fjalekalimi\/ndrysho$/);
    const newPassword = password + "-updated";
    await member.getByLabel("Fjalëkalimi", { exact: true }).fill(newPassword);
    await member.getByLabel("Përsërit fjalëkalimin").fill(newPassword);
    await member.getByRole("button", { name: "Ruaj fjalëkalimin" }).click();
    await expect(member).toHaveURL(/\/hyr\?status=password$/);
    await member.getByLabel("Email", { exact: true }).fill(memberEmail);
    await member.getByLabel("Fjalëkalimi", { exact: true }).fill(newPassword);
    await member.getByRole("button", { name: "Hyr", exact: true }).click();
    await expect(member).toHaveURL(/\/paneli$/);
    await expect(member.getByRole("link", { name: organizationName })).toBeVisible();
    await member.setViewportSize({ width: 390, height: 844 });
    expect(await member.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const { violations } = await new AxeBuilder({ page: member }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations).toEqual([]);
  } finally {
    await memberContext.close();
  }
});
