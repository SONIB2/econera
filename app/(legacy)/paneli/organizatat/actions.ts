"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { regions, uuid } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

export type InvitationState = { kind: "idle" | "invalid" | "failed" } | { kind: "issued"; code: string };

const organizationInput = z.object({
  name: z.string().trim().min(2).max(100),
  region: z.union([z.enum(regions), z.literal("")]).transform((value) => value || null),
});

export async function createOrganization(form: FormData) {
  const { db } = await requireAccount();
  const input = organizationInput.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/paneli/organizatat?status=invalid");
  const { data, error } = await db.rpc("create_organization", { organization_name: input.data.name, organization_region: input.data.region });
  if (error || !uuid.safeParse(data).success) redirect("/paneli/organizatat?status=failed");
  redirect(`/paneli/organizatat/${data}?status=organization-created`);
}

export async function acceptInvitation(form: FormData) {
  const { db } = await requireAccount();
  const code = z.string().trim().pipe(uuid).safeParse(form.get("code"));
  if (!code.success) redirect("/paneli/organizatat?status=invalid");
  const { data, error } = await db.rpc("accept_organization_invitation", { invitation_code: code.data });
  if (error) redirect("/paneli/organizatat?status=failed");
  if (!uuid.safeParse(data).success) redirect("/paneli/organizatat?status=invite-unavailable");
  redirect(`/paneli/organizatat/${data}?status=organization-joined`);
}

export async function issueInvitation(_previous: InvitationState, form: FormData): Promise<InvitationState> {
  const { db } = await requireAccount();
  const input = z.object({
    organization: uuid,
    email: z.string().trim().max(254).pipe(z.email()),
  }).safeParse(Object.fromEntries(form));
  if (!input.success) return { kind: "invalid" };
  const { data, error } = await db.rpc("issue_organization_invitation", { target_organization: input.data.organization, recipient: input.data.email });
  const code = uuid.safeParse(data);
  if (error || !code.success) return { kind: "failed" };
  return { kind: "issued", code: code.data };
}
