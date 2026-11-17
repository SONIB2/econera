"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { materialInput, revision, uuid } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

const versioned = z.object({ id: uuid, revision });

export async function createMaterial(form: FormData) {
  const { db } = await requireAccount();
  const parsed = materialInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/inventari/i-ri?status=invalid");
  const { error } = await db.from("materials").insert(parsed.data);
  if (error) redirect("/inventari/i-ri?status=failed");
  redirect("/inventari?status=saved");
}

export async function editMaterial(form: FormData) {
  const { db, user } = await requireAccount();
  const fields = Object.fromEntries(form);
  const target = versioned.safeParse(fields);
  if (!target.success) redirect("/inventari?status=invalid");
  const { id, revision: expected } = target.data;
  const path = `/inventari/${id}`;
  const parsed = materialInput.safeParse(fields);
  if (!parsed.success) redirect(`${path}?status=invalid`);
  const { data, error } = await db.from("materials").update(parsed.data).eq("id", id)
    .eq("owner_id", user.id).eq("revision", expected).select("id").maybeSingle();
  if (error) redirect(`${path}?status=failed`);
  if (!data) redirect("/inventari?status=conflict");
  redirect("/inventari?status=saved");
}

export async function changeMaterialState(form: FormData) {
  const { db } = await requireAccount();
  const parsed = versioned.extend({ intent: z.enum(["submit", "unpublish", "archive"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/inventari?status=invalid");
  const { id, revision: expected, intent } = parsed.data;
  const { data, error } = await db.rpc("change_material_state", { material_id: id, expected_revision: expected, intent });
  redirect(`/inventari?status=${error ? "failed" : data ? "saved" : "conflict"}`);
}
