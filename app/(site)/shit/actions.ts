"use server";

import { z } from "zod";
import { materialInput, sheetInput, verifyInput } from "@/lib/data";
import { sessionDatabase } from "@/lib/supabase";
import { checkFile, storagePath } from "@/lib/verify/files";

export type SellResult = { status: "login" | "invalid" | "failed" | "category" } | { status: "created"; id: string; submitted: boolean; photos: number; photoErrors: number };

const missing = (code?: string) => code === "42703" || code === "PGRST204";
const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));

async function account() {
  const db = await sessionDatabase();
  const user = db && (await db.auth.getUser()).data.user;
  return db && user?.email_confirmed_at ? { db, user } : null;
}

/** Sell wizard: saves the listing as a draft, uploads photos as private evidence, then submits it for human review. */
export async function createListing(form: FormData): Promise<SellResult> {
  const acc = await account();
  if (!acc) return { status: "login" };
  const { db, user } = acc;
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = materialInput.safeParse(fields);
  const sheet = sheetInput.safeParse(fields);
  const verify = verifyInput.safeParse(fields);
  if (!parsed.success || !sheet.success || !verify.success) return { status: "invalid" };
  const s = sheet.data;
  const extra = clean({ ...(s.sheet_material ? { sheet_material: s.sheet_material, color: s.color, length_mm: s.length_mm, width_mm: s.width_mm, thickness_mm: s.thickness_mm } : {}), ...verify.data });
  let res = await db.from("materials").insert({ ...parsed.data, ...extra }).select("id, revision").single();
  if (res.error && missing(res.error.code)) res = await db.from("materials").insert(parsed.data).select("id, revision").single();
  if (res.error?.code === "23514") return { status: "category" };
  if (res.error || !res.data) return { status: "failed" };
  const { id, revision } = res.data as { id: string; revision: number };

  let photos = 0; let photoErrors = 0;
  for (const file of form.getAll("photos").slice(0, 10)) {
    if (!(file instanceof File) || !file.size) continue;
    const checked = await checkFile(file);
    if ("error" in checked || !checked.mime.startsWith("image/")) { photoErrors++; continue; }
    const path = storagePath(user.id, "material", checked.name);
    const up = await db.storage.from("verify-docs").upload(path, checked.bytes, { contentType: checked.mime, upsert: false });
    if (up.error) { photoErrors++; continue; }
    const { error } = await db.from("verification_documents").insert({ subject_type: "material", subject_id: id, doc_type: "photo", storage_path: path, file_name: checked.name.slice(0, 200), mime_type: checked.mime, size_bytes: checked.size });
    if (error) { await db.storage.from("verify-docs").remove([path]); photoErrors++; } else photos++;
  }
  let submitted = false;
  if (form.get("submit") === "1") {
    const { data } = await db.rpc("change_material_state", { material_id: id, expected_revision: revision, intent: "submit" });
    submitted = Boolean(data);
  }
  return { status: "created", id, submitted, photos, photoErrors };
}

const row = z.record(z.string(), z.string());
/** Bulk import: each valid row becomes a private draft. Returns how many were saved and which rows were rejected. */
export async function importListings(rows: unknown): Promise<{ status: "login" | "invalid" } | { status: "done"; saved: number; rejected: number[] }> {
  const list = z.array(row).min(1).max(200).safeParse(rows);
  if (!list.success) return { status: "invalid" };
  const acc = await account();
  if (!acc) return { status: "login" };
  const valid: z.output<typeof materialInput>[] = []; const rejected: number[] = [];
  list.data.forEach((r, i) => { const p = materialInput.safeParse(r); if (p.success) valid.push(p.data); else rejected.push(i + 2); });
  if (!valid.length) return { status: "done", saved: 0, rejected };
  const { error } = await acc.db.from("materials").insert(valid);
  if (error) return { status: "done", saved: 0, rejected: list.data.map((_, i) => i + 2) };
  return { status: "done", saved: valid.length, rejected };
}
