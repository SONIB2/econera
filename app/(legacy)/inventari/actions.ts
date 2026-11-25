"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { materialInput, revision, sheetInput, uuid } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

const versioned = z.object({ id: uuid, revision });

export async function createMaterial(form: FormData) {
  const { db } = await requireAccount();
  const parsed = materialInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/inventari/i-ri?status=invalid");
  const sheet = sheetInput.safeParse(Object.fromEntries(form));
  if (!sheet.success) redirect("/inventari/i-ri?status=invalid");
  const extra = withSheet(sheet.data);
  let { error } = await db.from("materials").insert({ ...parsed.data, ...extra });
  // Offcut columns exist only after migration 202611250007; save the listing without them until then.
  if (error && extra && missingColumn(error.code)) ({ error } = await db.from("materials").insert(parsed.data));
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
  const sheet = sheetInput.safeParse(fields);
  if (!sheet.success) redirect(`${path}?status=invalid`);
  // Only write offcut fields when given, so editing an older listing never clears them.
  const extra = withSheet(sheet.data);
  const update = (values: object) => db.from("materials").update(values).eq("id", id).eq("owner_id", user.id).eq("revision", expected).select("id").maybeSingle();
  let { data, error } = await update({ ...parsed.data, ...extra });
  if (error && extra && missingColumn(error.code)) ({ data, error } = await update(parsed.data));
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

function withSheet(sheet: { sheet_material: string | null; color: string | null; length_mm: number | null; width_mm: number | null; thickness_mm: number | null }) {
  return sheet.sheet_material || sheet.color ? sheet : null;
}
function missingColumn(code?: string) {
  return code === "42703" || code === "PGRST204";
}
