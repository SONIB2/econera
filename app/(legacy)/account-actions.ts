"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { applicationOrigin, requireAccount, sessionDatabase } from "@/lib/supabase";
import { materialCategory, uuid } from "@/lib/data";

const email = z.string().trim().max(254).pipe(z.email());
const password = z.string().min(12).max(72).refine((value) => new TextEncoder().encode(value).length <= 72);

export async function signUp(form: FormData) {
  const parsed = z.object({ email, password }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/regjistrohu?status=invalid");
  const db = await sessionDatabase();
  const origin = applicationOrigin();
  if (!db || !origin) redirect("/regjistrohu?status=unavailable");
  const { data, error } = await db.auth.signUp({ ...parsed.data, options: { emailRedirectTo: `${origin}/autentikim` } });
  if (error && error.status !== 422 && error.code !== "user_already_exists") redirect("/regjistrohu?status=failed");
  if (data.session && data.user?.email_confirmed_at) redirect("/paneli");
  redirect("/regjistrohu?status=email");
}

export async function signIn(form: FormData) {
  const availability = form.get("availability");
  const quote = uuid.safeParse(form.get("quotation")).data;
  const category = materialCategory.safeParse(availability).data;
  const destination = quote ? `/materiale/${quote}/oferte` : category ? `/disponueshmeria?category=${category}` : availability === "all" ? "/disponueshmeria" : "/paneli";
  const context = quote ? `&quotation=${quote}` : category || availability === "all" ? `&availability=${category ?? "all"}` : "";
  const parsed = z.object({ email, password }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/hyr?status=invalid${context}`);
  const db = await sessionDatabase();
  if (!db) redirect(`/hyr?status=unavailable${context}`);
  const { data, error } = await db.auth.signInWithPassword(parsed.data);
  if (error || !data.user?.email_confirmed_at) redirect(`/hyr?status=credentials${context}`);
  redirect(destination);
}

export async function signOut() {
  const db = await sessionDatabase();
  if (!db) redirect("/hyr?status=unavailable");
  const { error } = await db.auth.signOut({ scope: "local" });
  if (error) redirect("/inventari?status=failed");
  redirect("/hyr");
}

export async function requestRecovery(form: FormData) {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) redirect("/fjalekalimi?status=invalid");
  const db = await sessionDatabase();
  const origin = applicationOrigin();
  if (!db || !origin) redirect("/fjalekalimi?status=unavailable");
  const { error } = await db.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${origin}/autentikim?flow=recovery` });
  if (error && error.code !== "user_not_found") redirect("/fjalekalimi?status=failed");
  redirect("/fjalekalimi?status=email");
}

export async function updatePassword(form: FormData) {
  const { db } = await requireAccount();
  const parsed = password.safeParse(form.get("password"));
  if (!parsed.success || parsed.data !== form.get("confirm")) redirect("/fjalekalimi/ndrysho?status=invalid");
  const { error } = await db.auth.updateUser({ password: parsed.data });
  if (error) redirect("/fjalekalimi/ndrysho?status=failed");
  const logout = await db.auth.signOut({ scope: "global" });
  if (logout.error) redirect("/inventari?status=saved");
  redirect("/hyr?status=password");
}
