import assert from "node:assert/strict";
import test from "node:test";
import { catalogueFilters, materialInput } from "../lib/data";

const draft = { title: "Parket lisi", description: "Tepricë e papërdorur nga një projekt.", category: "dru", region: "Fier", condition: "unused", unit: "m²", quantity: "20,125", unit_price: "15,25", currency: "EUR", fulfillment: "pickup" };

test("validates Albanian decimal notation and precision", () => {
  const parsed = materialInput.parse(draft);
  assert.equal(parsed.quantity, 20.125);
  assert.equal(parsed.unit_price, 15.25);
  for (const quantity of ["-1", "1e3", "0.0001", "", "10000001", "Infinity"]) {
    assert.equal(materialInput.safeParse({ ...draft, quantity }).success, false);
  }
});

test("rejects unknown regions, categories and currencies", () => {
  for (const patch of [{ region: "Elsewhere" }, { category: "other" }, { currency: "USD" }]) {
    assert.equal(materialInput.safeParse({ ...draft, ...patch }).success, false);
  }
});

test("price filters require a currency and accept zero", () => {
  const filters = catalogueFilters({ page: "1001", maxPrice: "2.00", sort: "price_asc" });
  assert.equal(filters.page, 1);
  assert.equal(filters.maxPrice, undefined);
  assert.equal(filters.sort, "recent");
  const valid = catalogueFilters({ page: "2", maxPrice: "0", minQuantity: "0", sort: "price_asc", currency: "EUR" });
  assert.equal(valid.maxPrice, 0);
  assert.equal(valid.minQuantity, 0);
  assert.equal(valid.sort, "price_asc");
  assert.equal(valid.page, 2);
});
