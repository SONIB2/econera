import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "econera_admin";

const MAX_AGE = 60 * 60 * 8;

/** Session value: issue time plus an HMAC of it keyed by the admin password, so sessions expire and a password change revokes them. */
function sign(issued: number) {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length >= 10 ? `${issued}.${createHmac("sha256", password).update(`econera-admin-v2:${issued}`).digest("hex")}` : null;
}

export const adminConfigured = () => sign(0) !== null;

export function passwordMatches(input: string) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const a = Buffer.from(input), b = Buffer.from(password);
  return password.length >= 10 && a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  const issued = Number(value.split(".")[0]);
  if (!Number.isInteger(issued) || Date.now() / 1000 - issued > MAX_AGE || issued > Date.now() / 1000 + 60) return false;
  const expected = sign(issued);
  if (!expected || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function setAdminSession(on: boolean) {
  const store = await cookies();
  if (!on) { store.delete(COOKIE); return; }
  store.set(COOKIE, sign(Math.floor(Date.now() / 1000))!, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: MAX_AGE });
}

/**
 * Pilot list access. Personal staff accounts (support or super admin, with MFA) always work. The shared password
 * still works only while ADMIN_PASSWORD is set; removing that variable in Vercel retires it.
 */
export async function pilotAccess(): Promise<"staff" | "password" | null> {
  const { currentStaff, hasRole } = await import("@/lib/verify/staff");
  const s = await currentStaff();
  if (s.kind === "staff" && s.mfa && hasRole(s.roles, ["support"])) return "staff";
  return (await isAdmin()) ? "password" : null;
}
