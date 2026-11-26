// ECONERA staging journey: real accounts, real Supabase Auth, MFA, Row Level Security and database rules.
// Run after seed.mjs:  node --test scripts/staging/journey.test.mjs
// Everything it creates is labelled TEST and stays in the staging project.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { stagingEnv } from "./env.mjs";
import { totp } from "./totp.mjs";

const env = stagingEnv();
const accounts = JSON.parse(readFileSync(".staging-accounts.json", "utf8"));
const admin = createClient(env.url, env.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(env.url, env.anon, { auth: { persistSession: false, autoRefreshToken: false } });
const run = Date.now().toString(36);
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function as(role) {
  const a = accounts[role];
  const db = createClient(env.url, env.anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.auth.signInWithPassword({ email: a.email, password: a.password });
  if (error) throw new Error(`${role}: ${error.message}`);
  if (a.totp_secret) {
    const { data } = await db.auth.mfa.listFactors();
    const factor = data.totp.find((f) => f.status === "verified");
    const { error: mfaError } = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(a.totp_secret) });
    if (mfaError) throw new Error(`${role} MFA: ${mfaError.message}`);
  }
  return db;
}

const listing = (title) => ({
  title, description: "Lot testimi për staging, jo për shitje reale.", category: "dru", region: "Tiranë", condition: "unused",
  unit: "m²", quantity: 40, unit_price: 12, currency: "EUR", fulfillment: "both", intended_use: "decorative", batch_no: `TEST-${run}`,
});
const visible = async (id) => ((await anon.from("public_catalogue").select("id").eq("id", id)).data ?? []).length === 1;

let material, revision;

test("1. An unverified seller can save a draft but cannot submit it for review", async () => {
  const db = await as("seller-unverified");
  const { data, error } = await db.from("materials").insert(listing(`TEST ${run} pa verifikim`)).select("id, revision").single();
  assert.ifError(error);
  const { data: ok } = await db.rpc("change_material_state", { material_id: data.id, expected_revision: data.revision, intent: "submit" });
  assert.equal(ok, false);
  await db.from("materials").update({ moderation: "approved", publication: "published" }).eq("id", data.id); // refused or ignored by the database
  assert.equal(await visible(data.id), false, "a seller cannot publish directly");
});

test("2. A verified seller lists a material with a photo and submits it", async () => {
  const db = await as("seller-individual");
  const { data, error } = await db.from("materials").insert(listing(`TEST ${run} parket lisi`)).select("id, revision").single();
  assert.ifError(error);
  material = data.id; revision = data.revision;
  const path = `${accounts["seller-individual"].id}/material/${run}.png`;
  const up = await db.storage.from("verify-docs").upload(path, PNG, { contentType: "image/png" });
  assert.ifError(up.error);
  const doc = await db.from("verification_documents").insert({ subject_type: "material", subject_id: material, doc_type: "photo", storage_path: path, file_name: "foto.png", mime_type: "image/png", size_bytes: PNG.length });
  assert.ifError(doc.error);
  const { data: ok } = await db.rpc("change_material_state", { material_id: material, expected_revision: revision, intent: "submit" });
  assert.equal(ok, true);
  assert.equal(await visible(material), false, "hidden until a person approves it");
  const { data: rev } = await db.from("materials").select("revision").eq("id", material).single();
  revision = rev.revision;
});

test("3. Privacy: other users cannot see the seller's documents or verification", async () => {
  const buyer = await as("buyer");
  assert.equal(((await buyer.from("verification_documents").select("id").eq("subject_id", material)).data ?? []).length, 0);
  assert.equal(((await buyer.from("seller_verifications").select("user_id")).data ?? []).length, 0);
  const { data: signed } = await buyer.storage.from("verify-docs").createSignedUrl(`${accounts["seller-individual"].id}/material/${run}.png`, 60);
  assert.equal(signed, null, "no signed link for someone else's file");
});

test("4. The seller cannot approve their own listing; staff need MFA and a reviewed photo", async () => {
  const seller = await as("seller-individual");
  const own = await seller.rpc("verify_decide", { material_id: material, expected_revision: revision, decision: "approve", reason: "Vetëmiratim.", checklist: {}, evidence: null, extra: {} });
  assert.notEqual(own.data, "ok");

  const officer = await as("reviewer-product");
  const early = await officer.rpc("verify_decide", { material_id: material, expected_revision: revision, decision: "approve", reason: "Kontrolluar sipas listës.", checklist: {}, evidence: null, extra: {} });
  assert.match(String(early.data), /^missing:photo/);
  const { data: docs } = await officer.from("verification_documents").select("id").eq("subject_id", material);
  for (const d of docs) assert.equal((await officer.rpc("review_document", { document_id: d.id, verdict: "accepted", notes: "Foto reale e lotit.", registry_checked: false })).data, true);
  const approve = await officer.rpc("verify_decide", { material_id: material, expected_revision: revision, decision: "approve", reason: "Kontrolluar sipas listës.", checklist: {}, evidence: null, extra: {} });
  assert.equal(approve.data, "ok", JSON.stringify(approve.error ?? approve.data));
});

test("5. The approved listing is public with a material passport, and the seller is notified", async () => {
  assert.equal(await visible(material), true);
  const { data: pv } = await anon.from("public_verification").select("passport_code").eq("material_id", material).single();
  assert.match(pv.passport_code, /^EC-AL-\d{6}$/);
  const seller = await as("seller-individual");
  const { data: notes } = await seller.from("notifications").select("kind").order("id", { ascending: false }).limit(10);
  assert.ok(notes.some((n) => /approved|published/.test(n.kind)), JSON.stringify(notes));
});

test("6. A buyer requests a quote; the seller sees it, other sellers do not", async () => {
  const buyer = await as("buyer");
  const { data: id, error } = await buyer.rpc("request_quotation", { listing_id: material, requested_quantity: 12.5, requested_fulfillment: "pickup", buyer_message: "TEST: a mund ta marr javën tjetër?" });
  assert.ifError(error);
  assert.ok(id);
  const seller = await as("seller-individual");
  assert.equal(((await seller.from("quotation_requests").select("id").eq("id", id)).data ?? []).length, 1);
  const other = await as("seller-business");
  assert.equal(((await other.from("quotation_requests").select("id").eq("id", id)).data ?? []).length, 0);
  const bad = await buyer.rpc("request_quotation", { listing_id: material, requested_quantity: -1, requested_fulfillment: "pickup", buyer_message: "TEST" });
  assert.ok(bad.error || !bad.data, "negative quantities are refused");
});

test("7. A business seller imports several drafts at once", async () => {
  const db = await as("seller-business");
  const rows = [1, 2, 3].map((i) => listing(`TEST ${run} import ${i}`));
  const { data, error } = await db.from("materials").insert(rows).select("id");
  assert.ifError(error);
  assert.equal(data.length, 3);
  for (const r of data) assert.equal(await visible(r.id), false, "imports stay private drafts");
});

test("8. Partner management: application → review → confirmed profile → published", async () => {
  const { data: lead, error } = await admin.from("leads").insert({
    company: `TEST Partner ${run}`, contact: "TEST Kontakt", email: env.inbox.replace("@", "+econera-partner@"), role: "furnitor", city: "Tiranë",
    interest: "te_dyja", materials: "TEST: aplikim partneriteti nga skripti i staging.", source: "partner", consent_at: new Date().toISOString(),
  }).select("id").single();
  assert.ifError(error);
  const buyer = await as("buyer");
  assert.equal(((await buyer.from("leads").select("id").eq("id", lead.id)).data ?? []).length, 0, "applications are private");
  assert.ok((await buyer.from("partners").insert({ name: "TEST hyrje e paautorizuar", category: "other", confirmation_ref: "x x x", confirmed_on: "2026-11-27" })).error);

  const staff = await as("admin");
  assert.ifError((await staff.from("leads").update({ status: "approved", review_note: "TEST: miratuar në staging." }).eq("id", lead.id)).error);
  const { data: p, error: pe } = await staff.from("partners").insert({ name: `TEST Partner ${run}`, category: "supplier", confirmation_ref: "TEST marrëveshje ref. STG-1", confirmed_on: "2026-11-27", application_id: lead.id }).select("id").single();
  assert.ifError(pe);
  assert.equal(((await anon.from("partners").select("id").eq("id", p.id)).data ?? []).length, 0, "drafts are hidden");
  assert.ifError((await staff.from("partners").update({ published: true }).eq("id", p.id)).error);
  assert.equal(((await anon.from("partners").select("id").eq("id", p.id)).data ?? []).length, 1, "published partner is public");
  assert.ifError((await staff.from("partners").update({ published: false }).eq("id", p.id)).error);
});

test("9. Everything sensitive was written to the audit log", async () => {
  const { data } = await admin.from("audit_log").select("action").gte("at", new Date(Date.now() - 30 * 60 * 1000).toISOString());
  const actions = new Set(data.map((r) => r.action));
  for (const a of ["listing.submitted", "partner.insert", "partner.update", "partner_application.approved"]) assert.ok(actions.has(a), `${a} missing from ${[...actions].join(", ")}`);
});
