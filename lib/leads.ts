import "server-only";
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const ROLES = { furnitor: "Furnitor / depo", kontraktor: "Kontraktor", transportues: "Transportues", zhvillues: "Zhvillues / investitor", tjeter: "Tjetër" } as const;
export const INTERESTS = { ka: "Kam stok për të shitur", kerkon: "Kërkoj materiale", te_dyja: "Të dyja" } as const;

export const leadSchema = z.object({
  company: z.string().trim().min(2, "Shkruaj emrin e kompanisë.").max(120),
  nipt: z.string().trim().toUpperCase().max(10).refine((v) => v === "" || /^[A-Z]\d{8}[A-Z]$/.test(v), "NIPT-i ka formatin L12345678A.").optional().default(""),
  contact: z.string().trim().min(2, "Shkruaj emrin e personit të kontaktit.").max(80),
  email: z.email("Email-i nuk është i saktë.").max(160),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Numri përmban karaktere të pavlefshme.").optional().default(""),
  role: z.enum(Object.keys(ROLES) as [keyof typeof ROLES, ...(keyof typeof ROLES)[]], { error: "Zgjidh rolin." }),
  city: z.string().trim().min(2, "Shkruaj qytetin.").max(60),
  interest: z.enum(Object.keys(INTERESTS) as [keyof typeof INTERESTS, ...(keyof typeof INTERESTS)[]]),
  materials: z.string().trim().min(3, "Na trego shkurt çfarë materialesh.").max(1000),
  consent: z.literal("on", { error: "Duhet pëlqimi për të ruajtur të dhënat." }),
  source: z.enum(["kontakt", "furnitore", "partner"]),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type Lead = Omit<LeadInput, "consent"> & { id: string; created_at: string; consent_at: string };

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

/** Without Supabase credentials, leads go to a git-ignored local file so the forms work in development. */
const LOCAL = path.join(process.cwd(), ".data", "leads.json");
async function readLocal(): Promise<Lead[]> {
  try { return JSON.parse(await readFile(LOCAL, "utf8")) as Lead[]; } catch { return []; }
}

export const storageMode = () => (adminDb() ? "supabase" : "lokal") as "supabase" | "lokal";

export async function saveLead(input: LeadInput) {
  const rest: Omit<LeadInput, "consent"> & { consent?: unknown } = { ...input };
  delete rest.consent;
  const now = new Date().toISOString();
  const db = adminDb();
  if (db) {
    const { error } = await db.from("leads").insert({ ...rest, consent_at: now });
    if (error) throw new Error(error.message);
    return;
  }
  if (process.env.VERCEL === "1") throw new Error("Databaza nuk është lidhur.");
  const leads = await readLocal();
  leads.push({ ...rest, id: crypto.randomUUID(), created_at: now, consent_at: now });
  await mkdir(path.dirname(LOCAL), { recursive: true });
  await writeFile(LOCAL, JSON.stringify(leads, null, 2));
}

export async function listLeads(): Promise<Lead[]> {
  const db = adminDb();
  if (db) {
    const { data, error } = await db.from("leads").select("*").order("created_at", { ascending: false }).limit(2000);
    if (error) throw new Error(error.message);
    return data as Lead[];
  }
  return (await readLocal()).reverse();
}

export function toCsv(leads: Lead[]) {
  const cols = ["created_at", "company", "nipt", "contact", "email", "phone", "role", "city", "interest", "materials", "source", "consent_at"] as const;
  // Prefix formula-like cells so spreadsheets treat them as text.
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return "﻿" + [cols.join(","), ...leads.map((l) => cols.map((c) => cell(l[c])).join(","))].join("\r\n");
}
