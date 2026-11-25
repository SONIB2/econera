import assert from "node:assert/strict";
import test from "node:test";
import { prescreen } from "../lib/verify/prescreen";
import { listingStatus } from "../lib/verify/labels";

const base = { title: "Tra çeliku HEA 200", description: "Tra strukturor HEA 200, 6 m.", category: "metal", intended_use: "non_structural", quantity: 10, unit: "copë", documents: [], missing: ["photo"], sameSellerTitles: [] };

test("prescreen flags missing evidence and structural mismatch, never approves", () => {
  const f = prescreen(base, "2026-11-25");
  assert.ok(f.some((x) => x.level === "block" && x.en.includes("photo")));
  assert.ok(f.some((x) => x.en.includes("looks structural")));
  assert.ok(f.every((x) => ["block", "warn", "info"].includes(x.level)));
});

test("prescreen detects expired and expiring documents and duplicates", () => {
  const f = prescreen({ ...base, intended_use: "structural", batch_no: "L1", missing: [], sameSellerTitles: ["Tra çeliku HEA 200"],
    documents: [
      { doc_type: "photo", review_status: "accepted", file_name: "a.jpg" },
      { doc_type: "dop", review_status: "accepted", expires_on: "2026-11-01", file_name: "dop.pdf" },
      { doc_type: "certificate", review_status: "pending", expires_on: "2026-12-10", file_name: "cert.pdf" },
    ] }, "2026-11-25");
  assert.ok(f.some((x) => x.level === "block" && x.en.startsWith("Expired")));
  assert.ok(f.some((x) => x.en.startsWith("Expires within 30")));
  assert.ok(f.some((x) => x.en.includes("same title")));
  assert.ok(!f.some((x) => x.en.includes("looks structural")));
});

test("asbestos is blocked", () => {
  assert.ok(prescreen({ ...base, description: "Pllaka me azbest", missing: [] }).some((x) => x.level === "block" && x.en.includes("Asbestos")));
});

test("listing status follows the workflow", () => {
  assert.equal(listingStatus("draft", "info_required").en, "Additional information required");
  assert.equal(listingStatus("published", "approved", 0).en, "Sold out");
  assert.equal(listingStatus("suspended", "suspended").en, "Suspended");
  assert.equal(listingStatus("expired", "approved").en, "Expired");
});
