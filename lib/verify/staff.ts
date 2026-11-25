import "server-only";
import { redirect } from "next/navigation";
import { sessionDatabase } from "@/lib/supabase";

export type StaffRole = "super_admin" | "seller_officer" | "product_officer" | "technical_reviewer" | "customer_protection" | "finance" | "support";

/**
 * Signed-in staff member with roles and MFA level. Authorisation is enforced again by PostgreSQL
 * (has_staff_role requires aal2), so this is navigation, not the security boundary.
 */
export async function currentStaff() {
  const db = await sessionDatabase();
  if (!db) return { kind: "unavailable" as const };
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { kind: "anonymous" as const };
  const { data: roles } = await db.rpc("staff_roles_of_me");
  const list = (roles ?? []) as StaffRole[];
  if (!list.length) return { kind: "not_staff" as const, user };
  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  return { kind: "staff" as const, db, user, roles: list, mfa: aal?.currentLevel === "aal2", canMfa: aal?.nextLevel === "aal2" };
}

export async function requireStaff(allowed: StaffRole[] = []) {
  const s = await currentStaff();
  if (s.kind === "unavailable") redirect("/hyr?status=unavailable");
  if (s.kind === "anonymous") redirect("/hyr?lloji=furnitor&next=admin");
  if (s.kind === "not_staff") redirect("/admin/pa-akses");
  if (!s.mfa) redirect("/admin/mfa");
  if (allowed.length && !s.roles.some((r) => r === "super_admin" || allowed.includes(r))) redirect("/admin?status=forbidden");
  return s;
}

export const hasRole = (roles: StaffRole[], wanted: StaffRole[]) => roles.includes("super_admin") || roles.some((r) => wanted.includes(r));
