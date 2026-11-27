import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { INTEREST_OPTIONS, PRODUCTS, STAGES, STATUS, UPCOMING } from "../lib/roadmap";

test("the homepage strip shows the ten upcoming products, none of them presented as working", () => {
  assert.equal(UPCOMING.length, 10);
  assert.deepEqual(UPCOMING.map((p) => p.name), [
    "ECONERA Smart Inventory", "ECONERA Tender Intelligence", "ECONERA Finance", "ECONERA Cost Estimator", "ECONERA Project Management",
    "ECONERA Smart Logistics", "ECONERA Carbon Intelligence", "ECONERA Document AI", "ECONERA Market Intelligence", "ECONERA ERP Connect",
  ]);
  for (const p of UPCOMING) {
    assert.ok(p.status === "planned" || p.status === "future", `${p.name} is ${p.status}`);
    assert.equal(p.href, undefined, `${p.name} must not link to a tool that does not exist`);
  }
});

test("only real tools are available or beta, and each links to its working page", () => {
  for (const p of PRODUCTS.filter((x) => x.status === "available" || x.status === "beta")) assert.ok(p.href, p.name);
  assert.equal(PRODUCTS.filter((p) => p.status === "development").length, 0, "nothing is in development until a release plan is confirmed");
});

test("every product belongs to one of the four stages and is described in both languages", () => {
  assert.deepEqual(STAGES.map((s) => s.title.en), ["Circular Construction", "Business Intelligence", "Construction Operations", "Enterprise Ecosystem"]);
  for (const p of PRODUCTS) {
    assert.ok(STAGES.some((s) => s.id === p.stage), p.id);
    assert.ok(p.text.sq.length > 10 && p.text.en.length > 10, p.id);
  }
  assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, PRODUCTS.length);
  assert.ok(INTEREST_OPTIONS.every((p) => p.status !== "available"));
});

test("no roadmap copy says 'coming soon'", () => {
  const files = ["lib/roadmap.ts", "app/(site)/roadmap/page.tsx", "components/roadmap/whats-next.tsx", "components/roadmap/interest-form.tsx"];
  for (const f of files) assert.doesNotMatch(readFileSync(f, "utf8"), /coming soon|së shpejti|vjen së shpejti/i, f);
  for (const s of Object.values(STATUS)) assert.doesNotMatch(s.label.en, /soon/i);
});
