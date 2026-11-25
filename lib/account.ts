import "server-only";
import { sessionDatabase } from "@/lib/supabase";
import type { Account } from "@/components/site/site-header";

/** Signed-in account for the header, or null. Never throws: the header must render without Supabase. */
export async function headerAccount(): Promise<Account> {
  try {
    const db = await sessionDatabase();
    if (!db) return null;
    const { data: { user } } = await db.auth.getUser();
    if (!user?.email) return null;
    return { email: user.email, seller: user.user_metadata?.role === "furnitor" };
  } catch {
    return null;
  }
}
