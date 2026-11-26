import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const seller = "a2cae598-cc33-4029-a11a-b0b43a32d386";
const buyer = "24e6c9a7-65b1-49a1-b24d-fab0eff2aa91";
const officer = "3589d375-887b-45d5-a6e3-09264ddd68c5";
const tech = "7d1c9f8e-1b2a-4c3d-9e8f-0a1b2c3d4e5f";
const sellerOfficer = "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b";

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant usage on schema auth to anon, authenticated;
    grant usage on schema public to anon, authenticated;
    insert into auth.users values ('${seller}'), ('${buyer}'), ('${officer}'), ('${tech}'), ('${sellerOfficer}');
  `);
  const dir = new URL("../supabase/migrations/", import.meta.url);
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(f, dir), "utf8"));
  await db.exec(`insert into public.staff_roles (user_id, role) values ('${officer}','product_officer'), ('${tech}','technical_reviewer'), ('${sellerOfficer}','seller_officer')`);
  // The seller in these scenarios has already passed seller verification (migration 0010 gates submission on it).
  await db.exec(`insert into public.seller_verifications (user_id, kind, legal_name, status) values ('${seller}','individual','Shitës Prove','approved')`);
  async function as(user?: string, aal: "aal1" | "aal2" = "aal2") {
    await db.exec(`reset role; set role ${user ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? ""]);
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: user, aal })]);
  }
  const one = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0];
  return { db, as, one };
}

const listing = (category = "dru", use = "decorative") => `insert into public.materials
  (title, description, category, region, condition, unit, quantity, unit_price, currency, fulfillment, intended_use, batch_no)
  values ('Material prove', 'Lot prove vetëm për testim.', '${category}', 'Tiranë', 'unused', 'm²', 40, 12, 'EUR', 'both', '${use}', 'LOT-7') returning id, revision`;

test("ECONERA Verify: human approval, documents, dual approval, re-review, suspension, audit", async () => {
  const { db, as, one } = await database();
  try {
    const visible = async () => (await db.query("select id from public.public_catalogue")).rows.length;
    const decide = async (id: string, rev: number, decision: string, reason = "Kontrolluar sipas listës.", extra = {}) =>
      (await one<{ r: string }>("select public.verify_decide($1,$2,$3,$4,'{}'::jsonb,null,$5::jsonb) as r", [id, rev, decision, reason, JSON.stringify(extra)])).r;
    const rev = async (id: string) => (await one<{ revision: number }>("select revision from public.materials where id = $1", [id])).revision;
    const doc = async (id: string, type: string, expires?: string) => (await one<{ id: string }>(
      `insert into public.verification_documents (subject_type, subject_id, doc_type, storage_path, file_name, mime_type, size_bytes, expires_on)
       values ('material', $1, $2, $3, 'f.pdf', 'application/pdf', 1000, $4) returning id`, [id, type, `${seller}/m/${crypto.randomUUID()}.pdf`, expires ?? null])).id;

    // A seller submits a low-risk listing: hidden until a human approves.
    await as(seller);
    const low = await one<{ id: string; revision: number }>(listing());
    assert.equal((await one<{ ok: boolean }>("select public.change_material_state($1,$2,'submit') as ok", [low.id, low.revision])).ok, true);
    assert.equal(await visible(), 0);
    assert.equal(await decide(low.id, low.revision, "approve"), "own_listing", "seller cannot approve own listing");
    await assert.rejects(db.query("update public.materials set moderation = 'approved', publication = 'published' where id = $1", [low.id]));

    // Staff without MFA cannot act.
    await as(officer, "aal1");
    assert.equal(await decide(low.id, low.revision, "approve"), "forbidden");

    // Approval needs accepted photos; reviewer asks for more information.
    await as(officer);
    assert.match(await decide(low.id, low.revision, "approve"), /^missing:photo/);
    assert.equal(await decide(low.id, low.revision, "request_info", "Mungojnë fotot reale të lotit."), "ok");
    await as(seller);
    const photo = await doc(low.id, "photo");
    assert.equal((await one<{ ok: boolean }>("select public.change_material_state($1,$2,'submit') as ok", [low.id, low.revision])).ok, true);
    await as(officer);
    assert.equal(await decide(low.id, low.revision, "approve", "ok"), "reason_required");
    assert.equal((await one<{ ok: boolean }>("select public.review_document($1,'accepted','Foto reale.') as ok", [photo])).ok, true);
    assert.equal(await decide(low.id, low.revision, "approve"), "ok");
    await as();
    assert.equal(await visible(), 1, "approved listing is public");
    const pv = await one<{ passport_code: string; documents: unknown[] }>("select passport_code, documents from public.public_verification");
    assert.match(pv.passport_code, /^EC-AL-\d{6}$/);
    await assert.rejects(db.query("select storage_path from public.verification_documents"), /permission denied/, "documents never public");

    // A material change sends it back for review.
    await as(seller);
    await db.query("update public.materials set description = 'Lot prove me përshkrim të ri.' where id = $1", [low.id]);
    await as();
    assert.equal(await visible(), 0, "changed listing waits for a new approval");

    // High risk: missing documents block; seller must be verified; two different reviewers.
    await as(seller);
    const high = await one<{ id: string; revision: number }>(listing("metal", "structural"));
    await db.query("select public.change_material_state($1,$2,'submit')", [high.id, high.revision]);
    assert.equal((await one<{ risk_level: string }>("select risk_level from public.materials where id = $1", [high.id])).risk_level, "high");
    const docs = { photo: await doc(high.id, "photo"), sheet: await doc(high.id, "technical_datasheet"), dop: await doc(high.id, "dop"), own: await doc(high.id, "ownership") };
    await as(officer);
    const r = await rev(high.id);
    for (const d of Object.values(docs)) await db.query("select public.review_document($1,'accepted','Kontrolluar.')", [d]);
    assert.match(await decide(high.id, r, "approve"), /^missing:inspection_report/);
    assert.equal(await decide(high.id, r, "request_inspection", "Kërkohet inspektim i lotit strukturor.", { scope: "Profilet HEA, gjendja dhe trashësia", lot: "LOT-7" }), "ok");
    // Photos alone never count as an inspection; the report must be recorded by a technical reviewer.
    await as(tech);
    const insp = await one<{ id: string }>("select id from public.inspections where material_id = $1", [high.id]);
    const report = await one<{ id: string }>(`insert into public.verification_documents (subject_type, subject_id, doc_type, storage_path, file_name, mime_type, size_bytes)
      values ('inspection', $1, 'inspection_report', '${tech}/i/report.pdf', 'r.pdf', 'application/pdf', 2000) returning id`, [insp.id]);
    assert.equal((await one<{ ok: boolean }>("select public.record_inspection($1,'Inxh. Arben Hoxha','Inxhinier strukturist, licencë','Kamëz','pass','Pa korrozion','—','approve',$2) as ok", [insp.id, report.id])).ok, true);
    assert.equal((await one<{ ok: boolean }>("select public.review_document($1,'accepted','Raport i nënshkruar.') as ok", [report.id])).ok, false, "nobody reviews their own document");
    await as(officer);
    assert.equal((await one<{ ok: boolean }>("select public.review_document($1,'accepted','Raport i nënshkruar.') as ok", [report.id])).ok, true);
    // If the seller's verification disappears after submission, the listing still cannot be approved.
    await db.exec("reset role");
    await db.query("delete from public.seller_verifications where user_id = $1", [seller]);
    await as(officer);
    assert.equal(await decide(high.id, r, "approve"), "seller_unverified");

    // Seller verification is private and needs an accepted identity document.
    await as(seller);
    await db.query("insert into public.seller_verifications (kind, legal_name, country, registration_number) values ('business','Alba Construction shpk','AL','L12345678A')");
    await assert.rejects(db.query("update public.seller_verifications set registration_number = '12345' where user_id = $1", [seller]), /check/, "NIPT format enforced");
    const extract = await one<{ id: string }>(`insert into public.verification_documents (subject_type, subject_id, doc_type, storage_path, file_name, mime_type, size_bytes)
      values ('seller', '${seller}', 'business_extract', '${seller}/s/qkb.pdf', 'qkb.pdf', 'application/pdf', 900) returning id`);
    await db.query("select public.submit_seller_verification()");
    await as(buyer);
    assert.equal((await db.query("select * from public.seller_verifications")).rows.length, 0, "other users cannot read seller data");
    await as(sellerOfficer);
    await db.query("select public.review_document($1,'accepted','Ekstrakt QKB i vlefshëm.', true)", [extract.id]);
    assert.equal((await one<{ ok: boolean }>("select public.decide_seller_verification($1,'approve','NIPT dhe ekstrakti përputhen.') as ok", [seller])).ok, true);

    await as(officer);
    assert.equal(await decide(high.id, r, "approve"), "awaiting_second_approval");
    assert.equal(await decide(high.id, r, "approve"), "awaiting_second_approval", "same reviewer cannot give the second approval");
    await as(tech);
    assert.equal(await decide(high.id, r, "approve", "Dokumentet teknike dhe inspektimi në rregull."), "ok");
    await as();
    const hv = await one<{ business_verified: boolean; inspection: { result: string } }>("select business_verified, inspection from public.public_verification where material_id = $1", [high.id]);
    assert.equal(hv.business_verified, true);
    assert.equal(hv.inspection.result, "pass");

    // Suspension removes it from the catalogue and blocks quotes; seller cannot edit it back.
    await as(buyer);
    await db.query("select public.request_quotation($1, 5, 'pickup', 'Kërkesë prove për ofertë.')", [high.id]);
    await as(officer);
    assert.equal(await decide(high.id, await rev(high.id), "suspend", "Raport sigurie nga një blerës.", { kind: "unsafe" }), "ok");
    await as();
    assert.equal((await db.query("select 1 from public.public_catalogue where id = $1", [high.id])).rows.length, 0);
    await as(buyer);
    assert.equal((await one<{ r: string | null }>("select public.request_quotation($1, 1, 'pickup', 'Edhe një kërkesë prove.') as r", [high.id])).r, null);
    assert.ok((await db.query("select 1 from public.notifications where kind = 'buyer.safety_notice'")).rows.length === 1, "affected buyer notified");
    await as(seller);
    assert.equal((await db.query("update public.materials set title = 'Titull i ri prove' where id = $1", [high.id])).affectedRows, 0);

    // Disputes: customer opens, staff resolves.
    await as(buyer);
    const dispute = await one<{ id: string }>("insert into public.disputes (material_id, kind, description) values ($1, 'not_as_pictured', 'Materiali nuk përputhet me fotot e listimit.') returning id", [high.id]);
    await as(officer);
    assert.equal((await db.query("select * from public.disputes")).rows.length, 0, "product officer is not customer protection");
    await db.exec("reset role");
    await db.query(`insert into public.staff_roles (user_id, role) values ('${officer}','customer_protection')`);
    await as(officer);
    assert.equal((await one<{ ok: boolean }>("select public.update_dispute($1,'resolved',null,'Shitësi pranoi kthimin e materialit.','not_applicable') as ok", [dispute.id])).ok, true);

    // Audit log: complete and append-only.
    await db.exec("reset role");
    const actions = (await db.query<{ action: string }>("select action from public.audit_log")).rows.map((x) => x.action);
    for (const a of ["listing.submitted", "listing.request_info", "document.accepted", "listing.approve", "listing.approve_first", "seller.approve", "inspection.recorded", "listing.suspend", "dispute.opened", "dispute.resolved"]) assert.ok(actions.includes(a), a);
    await assert.rejects(db.query("update public.audit_log set action = 'x'"), /append-only/);
    await assert.rejects(db.query("delete from public.audit_log"), /append-only/);
    await as(seller);
    assert.equal((await db.query("select * from public.audit_log")).rows.length, 0);
  } finally {
    await db.close();
  }
});

test("Expired mandatory certificate takes a listing out of the catalogue", async () => {
  const { db, as, one } = await database();
  try {
    await as(seller);
    const m = await one<{ id: string; revision: number }>(listing("dyer", "finishing"));
    for (const [t, exp] of [["photo", null], ["technical_datasheet", "2030-01-01"]] as const) {
      await db.query(`insert into public.verification_documents (subject_type, subject_id, doc_type, storage_path, file_name, mime_type, size_bytes, expires_on)
        values ('material', $1, $2, $3, 'f.pdf', 'application/pdf', 100, $4)`, [m.id, t, `${seller}/${t}.pdf`, exp]);
    }
    await db.query("select public.change_material_state($1,$2,'submit')", [m.id, m.revision]);
    await as(officer);
    for (const d of (await db.query<{ id: string }>("select id from public.verification_documents")).rows) await db.query("select public.review_document($1,'accepted','ok ok')", [d.id]);
    assert.equal((await one<{ r: string }>("select public.verify_decide($1,$2,'approve','Kontrolluar plotësisht.') as r", [m.id, m.revision])).r, "ok");
    await db.exec("reset role");
    await db.query("update public.verification_documents set expires_on = current_date - 1 where doc_type = 'technical_datasheet'");
    await as(officer);
    assert.equal((await one<{ n: number }>("select public.expire_listings() as n")).n, 1);
    await as();
    assert.equal((await db.query("select 1 from public.public_catalogue")).rows.length, 0);
  } finally {
    await db.close();
  }
});

test("A seller without approved verification cannot submit a listing, even by calling the RPC directly", async () => {
  const { db, as, one } = await database();
  try {
    await as(buyer);
    const m = await one<{ id: string; revision: number }>(listing());
    assert.equal((await one<{ ok: boolean }>("select public.change_material_state($1,$2,'submit') as ok", [m.id, m.revision])).ok, false);
    await assert.rejects(db.query("update public.materials set moderation = 'pending' where id = $1", [m.id]));
    await as(buyer);
    await assert.rejects(db.query("update public.seller_verifications set status = 'approved' where user_id = $1", [buyer]));
    await as();
    assert.equal((await db.query("select 1 from public.public_catalogue")).rows.length, 0);
  } finally {
    await db.close();
  }
});
