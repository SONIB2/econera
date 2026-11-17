"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { materialCategory, regions } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

const requestInput = z.object({
  category: materialCategory,
  region: z.union([z.enum(regions), z.literal("")]).transform((region) => region || null),
  details: z.string().trim().min(10).max(600),
});

export async function saveAvailabilityRequest(form: FormData) {
  const { db } = await requireAccount();
  const input = requestInput.safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/disponueshmeria?status=invalid");
  const { error } = await db.from("availability_requests").insert(input.data);
  if (error && error.code !== "23505") redirect(`/disponueshmeria?category=${input.data.category}&status=failed`);
  redirect(`/disponueshmeria?category=${input.data.category}&status=saved`);
}
