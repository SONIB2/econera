"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { decimal, uuid } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

const quotation = z.object({
  listing: uuid,
  quantity: decimal(3).pipe(z.number().positive()),
  fulfillment: z.enum(["pickup", "delivery"]),
  message: z.string().trim().min(10).max(1000),
});

export async function requestQuotation(form: FormData) {
  const { db } = await requireAccount();
  const listing = uuid.safeParse(form.get("listing"));
  if (!listing.success) redirect("/materiale");
  const path = `/materiale/${listing.data}/oferte`;
  const parsed = quotation.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`${path}?status=invalid`);
  const { quantity, fulfillment, message } = parsed.data;
  const { data, error } = await db.rpc("request_quotation", {
    listing_id: listing.data, requested_quantity: quantity, requested_fulfillment: fulfillment, buyer_message: message,
  });
  if (error || !data) redirect(`${path}?status=${error ? "failed" : "quote-unavailable"}`);
  redirect("/inventari/ofertat?status=quote-sent");
}
