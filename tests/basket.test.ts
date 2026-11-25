import assert from "node:assert/strict";
import test from "node:test";
import { buildPlan, buildPlans, parseBudget, parseCsv, parseRequirements } from "../lib/tools/basket";
import { demoListings } from "../lib/tools/inventory";

test("parses a mixed Albanian request with budget", () => {
  const text = "Më duhen 45 m² parket lisi, 20 m² pllaka banjoje bezhë, tri dyer të brendshme dhe bojë e bardhë 4 kova. Buxheti maksimal 1500 euro.";
  const reqs = parseRequirements(text);
  assert.deepEqual(reqs.map((r) => r.category), ["parket", "pllaka", "dyer", "boje"]);
  assert.equal(reqs[0].quantity, 45);
  assert.equal(reqs[0].unit, "m²");
  assert.equal(reqs[1].color, "bezhë");
  assert.equal(reqs[2].quantity, 3);
  assert.equal(parseBudget(text), 150000);
});

test("parses an English request", () => {
  const reqs = parseRequirements("I need 45 m2 of oak flooring, 20 m2 of beige bathroom tiles, three interior doors and white paint");
  assert.deepEqual(reqs.map((r) => r.category), ["parket", "pllaka", "dyer", "boje"]);
  assert.equal(reqs[2].quantity, 3);
  assert.equal(parseBudget("My maximum budget is €1,500."), 150000);
});

test("parses CSV with a header", () => {
  const reqs = parseCsv("Materiali;Sasia;Njësia\nParket lisi;30;m²\nDerë e brendshme;2;copë");
  assert.equal(reqs.length, 2);
  assert.equal(reqs[0].quantity, 30);
  assert.equal(reqs[1].category, "dyer");
});

test("plans never take more than a listing holds and report what is missing", () => {
  const listings = demoListings();
  const reqs = parseRequirements("5000 m² parket");
  const plan = buildPlan("budget", { requirements: reqs, listings });
  const taken = new Map<string, number>();
  for (const l of plan.lines) taken.set(l.listing.id, (taken.get(l.listing.id) ?? 0) + l.take);
  for (const [id, qty] of taken) assert.ok(qty <= listings.find((l) => l.id === id)!.quantity);
  assert.equal(plan.missing.length, 1);
  const covered = plan.lines.reduce((s, l) => s + l.take, 0);
  assert.equal(Math.round((covered + plan.missing[0].quantity) * 1000) / 1000, 5000);
});

test("budget plan is no more expensive in materials than eco plan; eco uses more reuse", () => {
  const listings = demoListings();
  const reqs = parseRequirements("40 m² parket, 20 m² pllaka, 2 dyer");
  const [budget, , eco] = buildPlans({ requirements: reqs, listings });
  assert.ok(budget.materialLek <= eco.materialLek);
  assert.ok(eco.reuseShare >= budget.reuseShare);
  assert.equal(budget.totalLek, budget.materialLek + budget.transportLek);
});

test("the same listing is not reserved twice across two needs", () => {
  const listings = demoListings();
  const reqs = parseRequirements("30 m² parket lisi i rikuperuar, 30 m² parket lisi i rikuperuar");
  const plan = buildPlan("eco", { requirements: reqs, listings });
  const reclaimed = plan.lines.filter((l) => l.listing.id === "demo:parket-lisi-rikuperuar").reduce((s, l) => s + l.take, 0);
  assert.ok(reclaimed <= 32);
});
