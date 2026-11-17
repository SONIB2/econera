import type { sessionDatabase } from "@/lib/supabase";

type Database = NonNullable<Awaited<ReturnType<typeof sessionDatabase>>>;
export type Membership = {
  role: "owner" | "member";
  joined_at: string;
  organization: { id: string; name: string; region: string | null };
};

const membershipFields = "role,joined_at,organization:organizations(id,name,region)";

export function readMemberships(db: Database, userId: string) {
  return db.from("organization_members").select(membershipFields).eq("user_id", userId)
    .order("joined_at", { ascending: false }).returns<Membership[]>();
}

export function readMembership(db: Database, userId: string, organizationId: string) {
  return db.from("organization_members").select(membershipFields).eq("user_id", userId)
    .eq("organization_id", organizationId).maybeSingle<Membership>();
}

export const organizationRole = { owner: "Pronar", member: "Anëtar" };
