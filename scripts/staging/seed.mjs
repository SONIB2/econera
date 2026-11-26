// Creates the ECONERA staging test accounts (idempotent). Run: node scripts/staging/seed.mjs
// Writes .staging-accounts.json (git-ignored) with each email, password and, for staff, the authenticator secret.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { alias, stagingEnv } from "./env.mjs";
import { totp } from "./totp.mjs";

const env = stagingEnv();
const admin = createClient(env.url, env.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const FILE = ".staging-accounts.json";
const saved = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};

/** role → who they are, what staff roles they get, and their seller verification state. */
const PEOPLE = {
  buyer: { label: "Individual buyer", kind: "buyer" },
  "seller-unverified": { label: "Seller who has not been verified", kind: "furnitor" },
  "seller-individual": { label: "Verified individual seller", kind: "furnitor", verification: { kind: "individual", legal_name: "TEST Shitës Individual" } },
  "seller-business": { label: "Verified business seller", kind: "furnitor", verification: { kind: "business", legal_name: "TEST Depo Materialesh shpk", registration_number: "L00000001T", representative: "TEST Përfaqësues" } },
  "reviewer-product": { label: "Product officer (first approval)", kind: "staff", roles: ["product_officer"] },
  "reviewer-technical": { label: "Technical reviewer (second approval, inspections)", kind: "staff", roles: ["technical_reviewer"] },
  "reviewer-seller": { label: "Seller officer (seller verification)", kind: "staff", roles: ["seller_officer"] },
  admin: { label: "Super administrator (all areas, partners, staff)", kind: "staff", roles: ["super_admin"] },
};

async function findUser(email) {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit || data.users.length < 200) return hit ?? null;
  }
  return null;
}

const out = {};
for (const [role, p] of Object.entries(PEOPLE)) {
  const email = alias(env.inbox, role);
  const password = saved[role]?.password ?? `Stg-${randomBytes(9).toString("base64url")}!7`;
  let user = await findUser(email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: p.kind === "furnitor" ? "furnitor" : "bleres", ...(p.kind === "furnitor" ? { plan: "falas" } : {}), test_account: true } });
    if (error) throw new Error(`${role}: ${error.message}`);
    user = data.user;
  } else {
    await admin.auth.admin.updateUserById(user.id, { password });
  }
  const record = { label: p.label, email, password, id: user.id };

  if (p.verification) {
    const { error } = await admin.from("seller_verifications").upsert({ user_id: user.id, country: "AL", status: "approved", decision_reason: "Llogari testimi në staging.", decided_at: new Date().toISOString(), ...p.verification }, { onConflict: "user_id" });
    if (error) throw new Error(`${role} verification: ${error.message}`);
  }
  for (const r of p.roles ?? []) {
    const { error } = await admin.from("staff_roles").upsert({ user_id: user.id, role: r }, { onConflict: "user_id,role" });
    if (error) throw new Error(`${role} staff role: ${error.message}`);
  }
  if (p.roles) {
    // Staff must use MFA. Enrol an authenticator (TOTP) once and keep its secret for testers and the journey script.
    record.totp_secret = saved[role]?.totp_secret;
    if (!record.totp_secret) {
      const session = createClient(env.url, env.anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error: signInError } = await session.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(`${role} sign-in: ${signInError.message}`);
      const { data: factors } = await session.auth.mfa.listFactors();
      for (const f of factors?.all ?? []) if (f.status !== "verified") await session.auth.mfa.unenroll({ factorId: f.id });
      const { data: enrol, error: enrolError } = await session.auth.mfa.enroll({ factorType: "totp", friendlyName: "ECONERA staging" });
      if (enrolError) throw new Error(`${role} MFA: ${enrolError.message}`);
      const { error: verifyError } = await session.auth.mfa.challengeAndVerify({ factorId: enrol.id, code: totp(enrol.totp.secret) });
      if (verifyError) throw new Error(`${role} MFA verify: ${verifyError.message}`);
      record.totp_secret = enrol.totp.secret;
    }
    record.totp_uri = `otpauth://totp/ECONERA%20staging:${encodeURIComponent(email)}?secret=${record.totp_secret}&issuer=ECONERA%20staging`;
  }
  out[role] = record;
  console.log(`✓ ${role.padEnd(20)} ${email}${p.roles ? "  (MFA enrolled)" : ""}`);
}

writeFileSync(FILE, JSON.stringify(out, null, 2), { mode: 0o600 });
console.log(`\nSaved ${Object.keys(out).length} accounts to ${FILE}. Keep this file private; it is git-ignored.`);
