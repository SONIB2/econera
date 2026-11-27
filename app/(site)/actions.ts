"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { passwordMatches, setAdminSession } from "@/lib/admin-auth";
import { leadSchema, saveLead } from "@/lib/leads";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { INTEREST_OPTIONS } from "@/lib/roadmap";

export type LeadState = { status: "idle" | "ok" | "error"; message?: string; errors?: Record<string, string>; values?: Record<string, string>; attempt?: number };

async function clientKey() {
  return clientIp(await headers());
}

export async function submitLead(previous: LeadState, form: FormData): Promise<LeadState> {
  const attempt = (previous.attempt ?? 0) + 1;
  // Echo the entries back so a failed submission never wipes what the person typed.
  const values = Object.fromEntries([...form.entries()].filter(([k]) => k !== "website").map(([k, v]) => [k, String(v).slice(0, 1000)]));
  // Honeypot: real people never fill the hidden field.
  if (String(form.get("website") ?? "")) return { status: "ok" };
  if (await rateLimited(`lead:${await clientKey()}`, 5, 10 * 60 * 1000)) return { status: "error", message: "Shumë dërgesa në pak kohë. Provo përsëri pas disa minutash.", values, attempt };

  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { status: "error", message: "Kontrollo fushat e shënuara.", errors, values, attempt };
  }
  try {
    await saveLead(parsed.data);
  } catch {
    return { status: "error", message: "Regjistrimi nuk u ruajt. Provo përsëri ose na shkruaj me email.", values, attempt };
  }
  return { status: "ok" };
}

/** Interest in upcoming products (roadmap page). Stored with the other leads, source "roadmap"; nothing is promised. */
export async function submitRoadmapInterest(previous: LeadState, form: FormData): Promise<LeadState> {
  const attempt = (previous.attempt ?? 0) + 1;
  const chosen = form.getAll("products").map(String).filter((id) => INTEREST_OPTIONS.some((p) => p.id === id));
  const values: Record<string, string> = Object.fromEntries([...form.entries()].filter(([k]) => k !== "website" && k !== "products").map(([k, v]) => [k, String(v).slice(0, 600)]));
  values.products = chosen.join(",");
  if (String(form.get("website") ?? "")) return { status: "ok" };
  if (await rateLimited(`lead:${await clientKey()}`, 5, 10 * 60 * 1000)) return { status: "error", message: "Shumë dërgesa në pak kohë. Provo përsëri pas disa minutash.", values, attempt };
  if (chosen.length === 0) return { status: "error", message: "Zgjidh të paktën një produkt.", errors: { products: "Zgjidh të paktën një produkt." }, values, attempt };

  const names = chosen.map((id) => INTEREST_OPTIONS.find((p) => p.id === id)!.name).join(", ");
  const note = String(form.get("note") ?? "").trim().slice(0, 600);
  const parsed = leadSchema.safeParse({
    company: String(form.get("company") ?? "").trim() || "Individ",
    contact: form.get("contact"), email: form.get("email"), role: form.get("role"), city: form.get("city"),
    interest: "te_dyja", materials: `Interes për: ${names}.${note ? ` Shënim: ${note}` : ""}`.slice(0, 1000),
    consent: form.get("consent"), source: "roadmap",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { status: "error", message: "Kontrollo fushat e shënuara.", errors, values, attempt };
  }
  try {
    await saveLead(parsed.data);
  } catch {
    return { status: "error", message: "Regjistrimi nuk u ruajt. Provo përsëri ose na shkruaj me email.", values, attempt };
  }
  return { status: "ok" };
}

export type LoginState = { error?: string };

export async function adminLogin(_: LoginState, form: FormData): Promise<LoginState> {
  if (await rateLimited(`admin:${await clientKey()}`, 8, 15 * 60 * 1000)) return { error: "Shumë përpjekje. Prit 15 minuta." };
  if (!passwordMatches(String(form.get("password") ?? ""))) return { error: "Fjalëkalimi nuk është i saktë." };
  await setAdminSession(true);
  redirect("/admin/pilot");
}

export async function adminLogout() {
  await setAdminSession(false);
  redirect("/admin/pilot");
}
