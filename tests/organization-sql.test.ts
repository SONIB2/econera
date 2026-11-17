import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const owner = "4b8d2bd6-71a8-4995-845c-10550b5f40fe";
const invited = "e25a37e9-4633-47f9-ab76-812c28759e40";
const outsider = "bc2532cc-962c-4ced-9865-26e94fcbdb9f";
const unverified = "66d75f29-b67b-4a06-9754-d4fa1d13fc59";

test("organization access is tenant scoped and invite acceptance is verified, single use and owner controlled", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key, email text not null, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      insert into auth.users values
        ('${owner}', 'owner@example.com', now()), ('${invited}', 'team@example.com', now()),
        ('${outsider}', 'outsider@example.com', now()), ('${unverified}', 'pending@example.com', null);
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/202611170005_organizations.sql", import.meta.url), "utf8"));

    async function asUser(user: string) {
      await db.exec("reset role; set role authenticated");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
    }
    async function value(query: string, parameters: unknown[] = []) {
      return (await db.query<{ value: string | null }>(query, parameters)).rows[0].value;
    }

    await asUser(unverified);
    assert.equal(await value("select public.create_organization('Kompani prove','Fier') as value"), null);
    await asUser(owner);
    const org = await value("select public.create_organization('Kompani prove','Fier') as value");
    assert.ok(org);
    assert.deepEqual((await db.query("select role from public.organization_members")).rows, [{ role: "owner" }]);
    const token = await value("select public.issue_organization_invitation($1,' Team@Example.com ') as value", [org]);
    assert.ok(token);
    await assert.rejects(db.query("select email from public.organization_invitations"), /permission denied/);

    await asUser(outsider);
    assert.deepEqual((await db.query("select id from public.organizations")).rows, []);
    assert.equal(await value("select public.accept_organization_invitation($1) as value", [token]), null);
    await assert.rejects(db.query("insert into public.organization_members values ($1,$2,'owner')", [org, outsider]), /permission denied/);

    await asUser(invited);
    assert.deepEqual((await db.query("select id from public.organizations")).rows, []);
    assert.equal(await value("select public.accept_organization_invitation($1) as value", [token]), org);
    assert.equal(await value("select public.accept_organization_invitation($1) as value", [token]), null);
    assert.deepEqual((await db.query("select id from public.organizations")).rows, [{ id: org }]);
    assert.deepEqual((await db.query("select role from public.organization_members")).rows, [{ role: "member" }]);
    assert.equal(await value("select public.issue_organization_invitation($1,'another@example.com') as value", [org]), null);

    await asUser(owner);
    const oldToken = await value("select public.issue_organization_invitation($1,'outsider@example.com') as value", [org]);
    assert.ok(oldToken);
    await db.exec("reset role");
    await db.query("update public.organization_invitations set expires_at = now() - interval '1 minute' where token_hash = sha256(convert_to($1, 'UTF8'))", [oldToken]);
    await asUser(outsider);
    assert.equal(await value("select public.accept_organization_invitation($1) as value", [oldToken]), null);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select id from public.organizations"), /permission denied/);
    await assert.rejects(value("select public.create_organization('Anonim','Fier') as value"), /permission denied/);
  } finally {
    await db.close();
  }
});
