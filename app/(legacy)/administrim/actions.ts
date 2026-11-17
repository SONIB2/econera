"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { revision, uuid } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

export async function reviewMaterial(form: FormData) {
  const { db } = await requireAccount();
  const parsed = z.object({ id: uuid, revision, verdict: z.enum(["approved", "rejected"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/administrim?status=invalid");
  const { id, revision: expected, verdict } = parsed.data;
  const { data, error } = await db.rpc("review_material", { material_id: id, expected_revision: expected, verdict });
  redirect(`/administrim?status=${error ? "failed" : data ? "saved" : "conflict"}`);
}
