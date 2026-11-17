"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { regions } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

const profileInput = z.object({
  display_name: z.string().trim().min(2).max(80),
  region: z.union([z.enum(regions), z.literal("")]).transform((region) => region || null),
});

export async function saveProfile(form: FormData) {
  const { db } = await requireAccount();
  const input = profileInput.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/inventari/profili?status=invalid");

  const { error } = await db.from("profiles").upsert(input.data, { onConflict: "user_id", defaultToNull: false });
  redirect(`/inventari/profili?status=${error ? "failed" : "saved"}`);
}
