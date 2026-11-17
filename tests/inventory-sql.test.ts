import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const owner = "a2cae598-cc33-4029-a11a-b0b43a32d386";
const outsider = "24e6c9a7-65b1-49a1-b24d-fab0eff2aa91";
const admin = "3589d375-887b-45d5-a6e3-09264ddd68c5";
const insertDraft = `insert into public.materials
  (title, description, category, region, condition, unit, quantity, unit_price, currency, fulfillment)
  values ('Parket prove', 'Inventar prove, vetëm në test.', 'dru', 'Fier', 'unused', 'm²', 20, 15, 'EUR', 'pickup')
  returning id`;

async function setupAuth(db: PGlite) {
  // Supply Supabase's roles and auth.uid() contract in embedded PostgreSQL.
  await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      insert into auth.users values ('${owner}'), ('${outsider}'), ('${admin}');
  `);
}

test("PostgreSQL enforces owner isolation, guarded moderation and public catalogue projection", async () => {
  const db = new PGlite();
  try {
    await setupAuth(db);
    await db.exec(await readFile(new URL("../supabase/migrations/202611170001_inventory.sql", import.meta.url), "utf8"));
    await db.query("insert into public.platform_admins values ($1)", [admin]);

    async function act(user?: string) {
      await db.exec(`reset role; set role ${user ? "authenticated" : "anon"}`);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? ""]);
    }
    const visible = async () => (await db.query("select id from public.public_catalogue")).rows.length;
    const review = async (id: string, revision: number, verdict: string) =>
      (await db.query<{ ok: boolean }>("select public.review_material($1,$2,$3) as ok", [id, revision, verdict])).rows[0].ok;
    const state = async (id: string, revision: number, intent: string) =>
      (await db.query<{ ok: boolean }>("select public.change_material_state($1,$2,$3) as ok", [id, revision, intent])).rows[0].ok;

    await act(owner);
    const [{ id }] = (await db.query<{ id: string }>(insertDraft)).rows;
    assert.equal(await visible(), 0);
    assert.equal(await review(id, 1, "approved"), false);
    await assert.rejects(db.query("update public.materials set moderation = 'approved' where id = $1", [id]), /permission denied/);
    assert.equal(await state(id, 1, "submit"), true);

    await act(outsider);
    assert.equal((await db.query("select id from public.materials")).rows.length, 0);
    assert.equal((await db.query("update public.materials set quantity = 0 where id = $1", [id])).affectedRows, 0);
    assert.equal(await state(id, 1, "archive"), false);
    assert.equal(await review(id, 1, "approved"), false);
    await assert.rejects(db.query("insert into public.platform_admins values ($1)", [outsider]), /permission denied/);

    await act(admin);
    assert.equal((await db.query("select id from public.materials")).rows.length, 1);
    assert.equal(await review(id, 2, "approved"), false);
    assert.equal(await review(id, 1, "rejected"), true);
    assert.equal(await visible(), 0);

    await act(owner);
    await db.query("update public.materials set quantity = 22 where id = $1", [id]);
    assert.equal(await state(id, 3, "submit"), true);
    await act(admin);
    assert.equal(await review(id, 1, "approved"), false);
    assert.equal(await review(id, 3, "approved"), true);

    await act();
    assert.equal(await visible(), 1);
    await assert.rejects(db.query("select id from public.materials"), /permission denied/);
    await assert.rejects(db.query("select owner_id from public.public_catalogue"), /does not exist/);

    await act(owner);
    assert.equal(await state(id, 4, "unpublish"), true);
    assert.equal(await visible(), 0);
    assert.equal(await state(id, 5, "submit"), true);
    await act(admin);
    assert.equal(await review(id, 5, "approved"), true);
    await act(owner);
    await assert.rejects(db.query("update public.materials set quantity = 0.0001 where id = $1", [id]), /check constraint/);
    await db.query("update public.materials set quantity = 0 where id = $1", [id]);
    assert.equal(await visible(), 0);
    assert.equal(await state(id, 7, "submit"), false);
    assert.equal(await state(id, 7, "archive"), true);
    assert.equal((await db.query("update public.materials set quantity = 0 where id = $1", [id])).affectedRows, 0);
    assert.equal(await state(id, 8, "submit"), false);
    await db.exec("reset role");
    assert.equal((await db.query("select id from public.moderation_events")).rows.length, 3);
  } finally {
    await db.close();
  }
});

test("profile creation and updates only affect the signed-in account", async () => {
  const db = new PGlite();
  try {
    await setupAuth(db);
    await db.exec(await readFile(new URL("../supabase/migrations/202611170002_profiles.sql", import.meta.url), "utf8"));
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    const save = "insert into public.profiles(display_name, region) values ($1, $2) on conflict (user_id) do update set display_name = excluded.display_name, region = excluded.region";
    await db.query(save, ["Emër prove", "Fier"]);
    await db.query(save, ["Emër i ri", null]);
    assert.deepEqual((await db.query("select user_id, display_name, region from public.profiles")).rows,
      [{ user_id: owner, display_name: "Emër i ri", region: null }]);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [outsider]);
    assert.deepEqual((await db.query("select user_id from public.profiles")).rows, []);
    assert.equal((await db.query("update public.profiles set display_name = 'Ndryshim' where user_id = $1", [owner])).affectedRows, 0);
    await assert.rejects(db.query("insert into public.profiles(user_id,display_name) values ($1,'Emër prove')", [owner]), /permission denied/);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select display_name from public.profiles"), /permission denied/);
  } finally {
    await db.close();
  }
});

test("Explorer adds catalogue categories and keeps availability requests private", async () => {
  const db = new PGlite();
  try {
    await setupAuth(db);
    for (const migration of ["202611170001_inventory.sql", "202611170003_explorer.sql"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`, import.meta.url), "utf8"));
    }
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    const addRequest = "insert into public.availability_requests (category, details) values ($1, 'Tjegulla për projektin tim')";
    await db.query(addRequest, ["cati"]);
    await assert.rejects(db.query(addRequest, ["cati"]), /unique constraint/);
    await assert.rejects(db.query(addRequest, ["unknown-category"]), /foreign key constraint/);
    assert.equal((await db.query("select id from public.availability_requests")).rows.length, 1);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [outsider]);
    assert.equal((await db.query("select id from public.availability_requests")).rows.length, 0);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select id from public.availability_requests"), /permission denied/);
  } finally {
    await db.close();
  }
});

test("quotation requests are idempotent, listing-bound and visible only to participants", async () => {
  const db = new PGlite();
  try {
    await setupAuth(db);
    for (const migration of ["202611170001_inventory.sql", "202611170004_masonry_quotes.sql"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`, import.meta.url), "utf8"));
    }
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    const [{ id }] = (await db.query<{ id: string }>(insertDraft.replace("'dru'", "'guri'"))).rows;
    await db.query("update public.materials set masonry_type = 'hollow', seller_label = 'Shitës prove' where id = $1", [id]);
    const quote = async (quantity: number, delivery = "pickup") =>
      (await db.query<{ result: string | null }>("select public.request_quotation($1,$2,$3,$4) as result", [id, quantity, delivery, "Kërkesë prove për muraturë"])).rows[0].result;
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [outsider]);
    assert.equal(await quote(5), null);
    await db.exec("reset role");
    await db.query("update public.materials set publication = 'published', moderation = 'approved' where id = $1", [id]);
    await db.exec("set role authenticated");
    assert.equal(await quote(25), null);
    assert.equal(await quote(5, "delivery"), null);
    const request = await quote(5);
    assert.ok(request);
    assert.equal(await quote(5), request);
    assert.equal((await db.query("select id from public.quotation_requests")).rows.length, 1);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [admin]);
    assert.equal((await db.query("select id from public.quotation_requests")).rows.length, 0);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    assert.equal((await db.query("select id from public.quotation_requests")).rows.length, 1);
    assert.equal(await quote(2), null);
    await db.query("update public.materials set masonry_type = 'clay' where id = $1", [id]);
    assert.equal((await db.query("select id from public.public_catalogue")).rows.length, 0);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select id from public.quotation_requests"), /permission denied/);
    await assert.rejects(quote(3), /permission denied/);
  } finally {
    await db.close();
  }
});
