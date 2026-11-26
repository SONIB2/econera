import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const staff = "6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const user = "1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b";

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant usage on schema auth to anon, authenticated; grant usage on schema public to anon, authenticated;
    insert into auth.users values ('${staff}'), ('${user}');
  `);
  const dir = new URL("../supabase/migrations/", import.meta.url);
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(f, dir), "utf8"));
  await db.exec(`insert into public.staff_roles (user_id, role) values ('${staff}','support')`);
  const as = async (id?: string, aal = "aal2") => {
    await db.exec(`reset role; set role ${id ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? ""]);
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, aal })]);
  };
  return { db, as };
}

const partner = (published = false, logo = "null", authorized = false) => `insert into public.partners (name, category, confirmation_ref, confirmed_on, published, logo_path, logo_authorized)
  values ('Depo Prove', 'supplier', 'Marrëveshje e nënshkruar, ref. TEST-1', '2026-12-01', ${published}, ${logo}, ${authorized}) returning id`;

test("partners appear publicly only after staff publish a confirmed record", async () => {
  const { db, as } = await database();
  try {
    await db.exec(`insert into public.leads (company, contact, email, role, city, interest, materials, source, consent_at)
      values ('Depo Prove shpk', 'Test Person', 'test@example.com', 'furnitor', 'Tiranë', 'te_dyja', 'Katalog pllakash', 'partner', now())`);

    // A visitor and an ordinary user can neither read applications nor create partners.
    await as();
    assert.equal((await db.query("select * from public.partners")).rows.length, 0);
    await as(user);
    assert.equal((await db.query("select * from public.leads")).rows.length, 0, "applications are private");
    await assert.rejects(db.query(partner(true)), "non-staff cannot create partners");

    // Staff without MFA are treated as not staff.
    await as(staff, "aal1");
    assert.equal((await db.query("select * from public.leads")).rows.length, 0);

    await as(staff);
    const lead = (await db.query<{ id: string }>("select id from public.leads")).rows[0];
    await db.query("update public.leads set status = 'info_requested', review_note = 'Dërgoni katalogun.' where id = $1", [lead.id]);
    const reviewed = (await db.query<{ reviewed_by: string }>("select reviewed_by from public.leads where id = $1", [lead.id])).rows[0];
    assert.equal(reviewed.reviewed_by, staff);
    await assert.rejects(db.query("update public.leads set email = 'x@y.z' where id = $1", [lead.id]), "staff cannot rewrite applicant data");

    await assert.rejects(db.query(partner(false, "'logos/a.png'", false)), /check/, "a logo needs recorded permission");
    const { id } = (await db.query<{ id: string }>(partner(false, "'logos/a.png'", true))).rows[0];
    await as();
    assert.equal((await db.query("select * from public.partners")).rows.length, 0, "draft partners are hidden");

    await as(staff);
    await db.query("update public.partners set published = true where id = $1", [id]);
    assert.equal((await db.query("delete from public.partners where id = $1", [id])).affectedRows, 0, "a published partner must be unpublished before deletion");
    await as();
    assert.equal((await db.query("select name from public.partners")).rows.length, 1);
    await as(user);
    assert.equal((await db.query("update public.partners set published = false where id = $1", [id])).affectedRows, 0, "users cannot unpublish");

    await db.exec("reset role");
    const audit = (await db.query<{ action: string }>("select action from public.audit_log where action like 'partner%' order by id")).rows.map((r) => r.action);
    assert.deepEqual(audit, ["partner_application.info_requested", "partner.insert", "partner.update"]);
  } finally {
    await db.close();
  }
});
