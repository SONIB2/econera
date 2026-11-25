import assert from "node:assert/strict";
import test from "node:test";
import { optimise, validate, type PieceSpec, type Stock } from "../lib/tools/smartcut";

const sheet = (id: string, length: number, width: number, priceLek: number, quantity = 1, defects?: Stock["defects"]): Stock =>
  ({ id, title: id, material: "MDF", length, width, thickness: 18, quantity, priceLek, defects });

const carpenter: PieceSpec[] = [
  { id: "a", label: "A", length: 800, width: 400, quantity: 2 },
  { id: "b", label: "B", length: 600, width: 300, quantity: 2 },
  { id: "c", label: "C", length: 1100, width: 500, quantity: 1, grain: true },
  { id: "d", label: "D", length: 400, width: 400, quantity: 1 },
];

test("every piece is placed without overlap, inside the sheet and with kerf", () => {
  const plan = optimise(carpenter, [sheet("s1", 1200, 800, 900), sheet("s2", 1650, 620, 1000), sheet("s3", 900, 450, 380, 2), sheet("full", 2800, 2070, 4600, 3)], { kerf: 4 });
  assert.equal(plan.unplaced.length, 0);
  assert.deepEqual(validate(plan, 4), []);
  const placed = plan.sheets.flatMap((s) => s.placements).length;
  assert.equal(placed, 6);
});

test("prefers cheap offcuts over a full sheet when they suffice", () => {
  const plan = optimise([{ id: "x", label: "X", length: 500, width: 400, quantity: 2 }], [sheet("full", 2800, 2070, 4600), sheet("small", 1200, 800, 900)]);
  assert.equal(plan.sheets.length, 1);
  assert.equal(plan.sheets[0].stock.id, "small");
  assert.equal(plan.costLek, 900);
});

test("grain pieces are never rotated; rotation off is respected", () => {
  const plan = optimise([{ id: "g", label: "G", length: 300, width: 700, quantity: 1, grain: true }], [sheet("s", 1000, 400, 100)]);
  assert.equal(plan.unplaced.length, 1, "700 mm across a 400 mm sheet cannot fit without rotation");
  const rotated = optimise([{ id: "g", label: "G", length: 300, width: 700, quantity: 1 }], [sheet("s", 1000, 400, 100)]);
  assert.equal(rotated.unplaced.length, 0);
  assert.equal(rotated.sheets[0].placements[0].rotated, true);
  const off = optimise([{ id: "g", label: "G", length: 300, width: 700, quantity: 1 }], [sheet("s", 1000, 400, 100)], { allowRotation: false });
  assert.equal(off.unplaced.length, 1);
});

test("defect areas stay free", () => {
  const plan = optimise([{ id: "p", label: "P", length: 480, width: 480, quantity: 4 }], [sheet("d", 1500, 1000, 1700, 1, [{ x: 1300, y: 0, w: 200, h: 180 }])], { kerf: 3 });
  assert.deepEqual(validate(plan, 3), []);
  assert.equal(plan.unplaced.length, 0);
});

test("reports pieces that do not fit any stock", () => {
  const plan = optimise([{ id: "big", label: "BIG", length: 3000, width: 2500, quantity: 1 }], [sheet("full", 2800, 2070, 4600)]);
  assert.equal(plan.unplaced.length, 1);
  assert.equal(plan.costLek, 0);
});

test("utilisation and areas add up", () => {
  const plan = optimise(carpenter, [sheet("full", 2800, 2070, 4600, 2)], { kerf: 3 });
  const pieces = 2 * 800 * 400 + 2 * 600 * 300 + 1100 * 500 + 400 * 400;
  assert.equal(plan.pieceArea, pieces);
  assert.ok(plan.utilization > 0 && plan.utilization <= 1);
  assert.ok(plan.wasteArea >= 0);
});
