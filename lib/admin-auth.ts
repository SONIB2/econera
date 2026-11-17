import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "econera_admin";

function token() {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length >= 10 ? createHmac("sha256", password).update("econera-admin-v1").digest("hex") : null;
}

export const adminConfigured = () => token() !== null;

export function passwordMatches(input: string) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const a = Buffer.from(input), b = Buffer.from(password);
  return password.length >= 10 && a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin() {
  const expected = token();
  const value = (await cookies()).get(COOKIE)?.value;
  if (!expected || !value || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function setAdminSession(on: boolean) {
  const store = await cookies();
  if (!on) { store.delete(COOKIE); return; }
  store.set(COOKIE, token()!, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: 60 * 60 * 8 });
}
