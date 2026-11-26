import assert from "node:assert/strict";
import test from "node:test";
import { answer } from "../lib/assistant/brain";
import { ROUTES } from "../lib/assistant/registry";
import type { Reply } from "../lib/assistant/types";

const guest = { signedIn: false, seller: "none" } as const;
const known = new Set(Object.values(ROUTES).flatMap((r) => [r.href]));
/** Every link the assistant returns must be an app route, a marketplace URL or a real listing page. */
function links(r: Reply) {
  const out: string[] = [];
  for (const b of r.blocks) {
    if (b.type === "actions") for (const a of b.items) if (a.kind === "link") out.push(a.href);
    if (b.type === "categories") for (const c of b.items) out.push(c.href);
    if (b.type === "products") { out.push(b.allHref); for (const c of b.items) out.push(c.href); }
  }
  return out;
}
const internal = (h: string) => h.startsWith("/") && !h.startsWith("//");

test("'floor' offers flooring categories with marketplace links", async () => {
  const r = await answer("floor", "en", {}, guest);
  const cats = r.blocks.find((b) => b.type === "categories");
  assert.ok(cats && cats.type === "categories" && cats.items.length > 0);
  for (const c of cats.items) assert.match(c.href, /^\/treg\?/);
});

test("all returned links are internal routes; demo products are labelled as demo", async () => {
  for (const q of ["20 m2 tiles in Tirana", "oak flooring under 600 euro", "i want to sell materials", "renovate my kitchen", "verify sellers", "contact"]) {
    const r = await answer(q, "en", {}, guest);
    for (const h of links(r)) assert.ok(internal(h), `${q}: ${h}`);
    for (const b of r.blocks) if (b.type === "products") for (const c of b.items) assert.equal(c.demo, c.href.startsWith("/treg/demo/"), `${q}: ${c.href}`);
  }
});

test("selling respects the account state", async () => {
  const anon = await answer("I want to sell materials", "en", {}, guest);
  const hrefs = links(anon);
  assert.ok(hrefs.some((h) => h.startsWith("/hyr") || h.startsWith("/regjistrohu") || h.startsWith("/shit")), hrefs.join(","));
  assert.ok(!hrefs.some((h) => h.startsWith("/inventari/ri")), "guests are not sent straight to the listing editor");
  const approved = await answer("I want to sell materials", "en", {}, { signedIn: true, seller: "approved" });
  assert.ok(links(approved).length > 0);
});

test("adding to the cart always asks for confirmation first", async () => {
  const first = await answer("20 m2 tiles in Tirana", "en", {}, guest);
  const r = await answer("add the first one", "en", first.ctx, guest);
  for (const b of r.blocks) assert.notEqual(b.type === "actions" && b.items.some((a) => a.kind === "link" && a.href.includes("shporta?add")), true);
  if (first.blocks.some((b) => b.type === "products" && b.items.length)) assert.ok(r.blocks.some((b) => b.type === "confirm"), "cart add needs a confirm block");
});

test("route registry only contains internal paths", () => {
  for (const h of known) assert.ok(internal(h) || h.startsWith("#"), h);
});
