import assert from "node:assert/strict";
import test from "node:test";
import { PLAN_EN, PLAN_NAME_EN, SUPPLIER_PLANS, pilotOfferActive } from "../lib/pricing";

test("one pricing source: every plan has English copy with the same number of features", () => {
  for (const p of SUPPLIER_PLANS) {
    assert.ok(PLAN_NAME_EN[p.id]);
    assert.equal(PLAN_EN[p.id].features.length, p.features.length, p.id);
  }
});

test("yearly prices are about 20% below monthly, as the toggle says", () => {
  for (const p of SUPPLIER_PLANS.filter((x) => x.monthly > 0)) {
    const off = 1 - p.annual / p.monthly;
    assert.ok(off > 0.19 && off < 0.21, `${p.id}: ${(off * 100).toFixed(1)}%`);
  }
});

test("commission falls as plans rise; free plan costs nothing", () => {
  const c = SUPPLIER_PLANS.map((p) => parseFloat(p.commission));
  for (let i = 1; i < c.length; i++) assert.ok(c[i] < c[i - 1]);
  assert.equal(SUPPLIER_PLANS[0].monthly, 0);
  assert.equal(SUPPLIER_PLANS.filter((p) => p.highlight).length, 1);
});

test("pilot offer has no end date configured, so it shows", () => {
  assert.equal(pilotOfferActive(new Date("2026-11-26")), true);
});
