import assert from "node:assert/strict";
import test from "node:test";
import { understand } from "../lib/tools/intents";

test("voice search in English with budget and city", () => {
  const i = understand("Find 30 square meters of parquet under 300 euros near Tirana");
  assert.equal(i.kind, "search");
  if (i.kind !== "search") return;
  assert.equal(i.requirement.category, "parket");
  assert.equal(i.requirement.quantity, 30);
  assert.equal(i.requirement.unit, "m²");
  assert.equal(i.maxTotalLek, 30000);
  assert.equal(i.city, "Tiranë");
});

test("voice search in Albanian", () => {
  const i = understand("Gjej 600 tulla me vrima në Durrës");
  assert.equal(i.kind, "search");
  if (i.kind === "search") { assert.equal(i.requirement.category, "tulla"); assert.equal(i.city, "Durrës"); }
});

test("voice listing extracts fields and asks for confirmation", () => {
  const i = understand("I have 25 square meters of unused beige ceramic tiles in Tirana. I want to sell them for 8 euros per square meter.");
  assert.equal(i.kind, "sell");
  if (i.kind !== "sell") return;
  assert.equal(i.needsConfirmation, true);
  assert.equal(i.draft.quantity, 25);
  assert.equal(i.draft.unit, "m²");
  assert.equal(i.draft.price, 8);
  assert.equal(i.draft.currency, "EUR");
  assert.equal(i.draft.region, "Tiranë");
  assert.equal(i.draft.color, "bezhë");
  assert.equal(i.draft.condition, "unused");
  assert.deepEqual(i.missing, []);
});

test("Albanian listing", () => {
  const i = understand("Kam 40 m² parket të ripërdorur në Shkodër, dua t'i shes 12 euro për m²");
  assert.equal(i.kind, "sell");
  if (i.kind === "sell") { assert.equal(i.draft.price, 12); assert.equal(i.draft.region, "Shkodër"); assert.equal(i.draft.condition, "reusable"); }
});

test("navigation and basket", () => {
  const nav = understand("Hap SmartCut");
  assert.equal(nav.kind, "navigate");
  if (nav.kind === "navigate") assert.equal(nav.href, "/ai/smartcut");
  const add = understand("Shto 20 m² pllaka në shportë");
  assert.equal(add.kind, "basket");
});
