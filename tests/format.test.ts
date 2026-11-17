import assert from "node:assert/strict";
import test from "node:test";
import { formatDate, formatNumber } from "../lib/format";
import { coverPlan, parseQuery, searchStock } from "../lib/market";
import { certificateFigures } from "../lib/certificate";

test("formatNumber groups thousands and trims decimals", () => {
  assert.equal(formatNumber(1500000, 0), "1,500,000");
  assert.equal(formatNumber(7200, 0), "7,200");
  assert.equal(formatNumber(0.21, 2), "0.21");
  assert.equal(formatNumber(2.5, 1), "2.5");
  assert.equal(formatNumber(3, 2), "3");
  assert.equal(formatDate(new Date(2026, 10, 17)), "17 nëntor 2026");
});

test("parseQuery reads quantity, material and city", () => {
  const q = parseQuery("Më duhen 600 tulla me vrima në Durrës");
  assert.equal(q.quantity, 600);
  assert.equal(q.category, "tulla");
  assert.equal(q.city, "Durrës");
});

test("coverPlan covers the requested quantity from demo stock", () => {
  const offers = searchStock({ category: "tulla", quantity: 600 });
  const plan = coverPlan(offers, 600);
  assert.equal(plan.covered, 600);
  assert.ok(plan.cost >= 600 * 12);
});

test("certificate figures use the CO2 factor and unit mass", () => {
  const f = certificateFigures({ category: "tulla", label: "x", quantity: 1000, unit: "copë" });
  assert.equal(Math.round(f.massKg), 3200);
  assert.equal(Math.round(f.co2Kg), 672);
});
