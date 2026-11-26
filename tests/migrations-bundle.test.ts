import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("the staging bundle applies cleanly to an empty database in one transaction", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;`);
    await db.exec(await readFile(new URL("../supabase/staging/all-migrations.sql", import.meta.url), "utf8"));
    const tables = (await db.query<{ t: string }>("select table_name as t from information_schema.tables where table_schema = 'public'")).rows.map((r) => r.t);
    for (const t of ["materials", "seller_verifications", "verification_documents", "quotation_requests", "leads", "partners", "staff_roles", "audit_log"]) assert.ok(tables.includes(t), t);
    const rls = (await db.query<{ n: number }>("select count(*)::int as n from pg_tables where schemaname = 'public' and not rowsecurity")).rows[0].n;
    assert.equal(rls, 0, "every public table has Row Level Security on");
  } finally {
    await db.close();
  }
});
