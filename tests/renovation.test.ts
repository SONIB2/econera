import assert from "node:assert/strict";
import test from "node:test";
import { buildPlan } from "../lib/tools/basket";
import { demoListings } from "../lib/tools/inventory";
import { DEFAULT_ASSUMPTIONS, estimate, STYLES, toRequirements, type Room } from "../lib/tools/renovation";

const room: Room = { type: "ndenje", lengthM: 5, widthM: 4, heightM: 2.8, doors: 1, windows: 2, floor: "parket", scope: { floor: true, walls: true, ceiling: true, wallTiles: true, doors: true, fixtures: true } };
const style = STYLES[0];

test("living room estimate follows the stated formulas", () => {
  const lines = estimate(room, style);
  const floor = lines.find((l) => l.key === "floor")!;
  assert.equal(floor.quantity, 22); // 20 m² + 10 %
  const paint = lines.find((l) => l.key === "paint")!;
  // walls 18 m × 2.8 − 1.9 − 3.2 = 45.3; + ceiling 20 = 65.3 m² × 2 coats ÷ 10 = 13.06 L → 1 bucket of 15 L
  assert.equal(paint.quantity, 1);
  assert.ok(!lines.some((l) => l.key === "wallTiles"), "no wall tiles outside bathroom or kitchen");
  assert.equal(lines.find((l) => l.key === "doors")!.quantity, 1);
});

test("bathroom gets wall tiles, floor tiles and fixtures", () => {
  const lines = estimate({ ...room, type: "banjo", lengthM: 2.5, widthM: 2, heightM: 2.6, windows: 0 }, style);
  assert.equal(lines.find((l) => l.key === "floor")!.category, "pllaka");
  const wall = lines.find((l) => l.key === "wallTiles")!;
  // perimeter 9 × 2.1 − 1.9 = 17; + 12 % = 19.04
  assert.equal(wall.quantity, 19);
  assert.ok(lines.some((l) => l.key === "fixtures"));
});

test("edited assumptions change the result", () => {
  const more = DEFAULT_ASSUMPTIONS.map((a) => (a.key === "wasteFloor" ? { ...a, value: 20 } : a));
  assert.equal(estimate(room, style, more).find((l) => l.key === "floor")!.quantity, 24);
});

test("estimate feeds the market match", () => {
  const plan = buildPlan("balanced", { requirements: toRequirements(estimate(room, style)), listings: demoListings() });
  assert.ok(plan.lines.length > 0);
  assert.ok(plan.lines.every((l) => l.listing.quantity >= l.take));
});
