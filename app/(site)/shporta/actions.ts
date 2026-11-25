"use server";

import { z } from "zod";
import { sessionDatabase } from "@/lib/supabase";

const input = z.object({
  items: z.array(z.object({ id: z.string().uuid(), quantity: z.number().positive().max(10_000_000) })).min(1).max(40),
  fulfillment: z.enum(["pickup", "delivery"]),
  message: z.string().trim().min(10).max(1000),
});

export type CartResult = { status: "login" } | { status: "invalid" } | { status: "done"; sent: string[]; failed: string[] };

/** Sends one quote request per cart item through request_quotation (the seller confirms price and availability). */
export async function sendCart(raw: unknown): Promise<CartResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const db = await sessionDatabase();
  const user = db && (await db.auth.getUser()).data.user;
  if (!db || !user?.email_confirmed_at) return { status: "login" };
  const sent: string[] = []; const failed: string[] = [];
  for (const item of parsed.data.items) {
    const { data, error } = await db.rpc("request_quotation", {
      listing_id: item.id, requested_quantity: Math.round(item.quantity * 1000) / 1000,
      requested_fulfillment: parsed.data.fulfillment, buyer_message: parsed.data.message,
    });
    (error || !data ? failed : sent).push(item.id);
  }
  return { status: "done", sent, failed };
}
