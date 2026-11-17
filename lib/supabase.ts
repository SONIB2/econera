import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export function supabaseSettings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function publicDatabase() {
  const settings = supabaseSettings();
  return settings && createClient(settings.url, settings.key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function sessionDatabase() {
  const settings = supabaseSettings();
  if (!settings) return null;
  const store = await cookies();
  return createServerClient(settings.url, settings.key, {
    cookieOptions: { httpOnly: true, secure: applicationOrigin()?.startsWith("https://") ?? false, sameSite: "lax" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (updates) => {
        try {
          updates.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // The proxy writes refreshed cookies for Server Components.
        }
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function requireAccount() {
  const db = await sessionDatabase();
  if (!db) redirect("/hyr?status=unavailable");
  const { data: { user } } = await db.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/hyr");
  return { db, user };
}

export function applicationOrigin() {
  const origin = process.env.APP_ORIGIN ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : "");
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}
