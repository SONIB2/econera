"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAccount } from "@/lib/supabase";
import { checkFile, storagePath } from "@/lib/verify/files";

const back = (path: unknown) => (typeof path === "string" && /^\/[a-z0-9/_-]*$/i.test(path) ? path : "/verifikimi");
const text = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const sellerInput = z.object({
  kind: z.enum(["individual", "business"]),
  legal_name: z.string().trim().min(2).max(160),
  country: z.enum(["AL", "XK", "MK", "ME", "IT", "GR", "DE", "GB", "US"]),
  phone: z.string().trim().regex(/^\+?[0-9 ]{6,20}$/).optional().or(z.literal("")).transform((v) => v || null),
  address: text(300),
  registration_number: z.string().trim().toUpperCase().max(40).optional().transform((v) => v || null),
  tax_number: text(40),
  representative: text(160),
  public_name: text(120),
}).superRefine((v, ctx) => {
  if (v.kind === "business" && !v.registration_number) ctx.addIssue({ code: "custom", path: ["registration_number"], message: "required" });
  if (v.kind === "business" && v.country === "AL" && v.registration_number && !/^[A-Z][0-9]{8}[A-Z]$/.test(v.registration_number)) ctx.addIssue({ code: "custom", path: ["registration_number"], message: "nipt" });
  if (v.kind === "business" && v.country === "XK" && v.registration_number && !/^[0-9]{9}$/.test(v.registration_number)) ctx.addIssue({ code: "custom", path: ["registration_number"], message: "nui" });
});

export async function saveSeller(form: FormData) {
  const { db, user } = await requireAccount();
  const parsed = sellerInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/verifikimi?status=${parsed.error.issues.some((i) => i.message === "nipt") ? "nipt" : parsed.error.issues.some((i) => i.message === "nui") ? "nui" : "invalid"}`);
  const { data: existing } = await db.from("seller_verifications").select("user_id").eq("user_id", user.id).maybeSingle();
  const { error } = existing
    ? await db.from("seller_verifications").update(parsed.data).eq("user_id", user.id)
    : await db.from("seller_verifications").insert(parsed.data);
  if (error) redirect(`/verifikimi?status=${error.code === "42P01" ? "unavailable" : "failed"}`);
  redirect("/verifikimi?status=saved");
}

export async function submitSeller() {
  const { db } = await requireAccount();
  const { data, error } = await db.rpc("submit_seller_verification");
  redirect(`/verifikimi?status=${error ? "failed" : data ? "submitted" : "incomplete"}`);
}

const docInput = z.object({
  subject_type: z.enum(["seller", "material", "dispute"]),
  subject_id: z.string().min(8).max(64),
  doc_type: z.string().max(40),
  issuer: text(160), reference_no: text(120),
  issued_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((v) => v || null),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((v) => v || null),
});

/** Uploads a private verification document: real type checked from bytes, stored under the owner's folder. */
export async function uploadDocument(form: FormData) {
  const { db, user } = await requireAccount();
  const to = back(form.get("back"));
  const parsed = docInput.safeParse(Object.fromEntries([...form.entries()].filter(([k]) => k !== "file")));
  const file = form.get("file");
  if (!parsed.success || !(file instanceof File)) redirect(`${to}?status=invalid`);
  const checked = await checkFile(file);
  if ("error" in checked) redirect(`${to}?status=file-${checked.error}`);
  const path = storagePath(user.id, parsed.data.subject_type, checked.name);
  const up = await db.storage.from("verify-docs").upload(path, checked.bytes, { contentType: checked.mime, upsert: false });
  if (up.error) redirect(`${to}?status=storage`);
  const { error } = await db.from("verification_documents").insert({ ...parsed.data, storage_path: path, file_name: checked.name.slice(0, 200), mime_type: checked.mime, size_bytes: checked.size });
  if (error) { await db.storage.from("verify-docs").remove([path]); redirect(`${to}?status=failed`); }
  redirect(`${to}?status=uploaded`);
}

export async function submitListing(form: FormData) {
  const { db } = await requireAccount();
  const id = z.uuid().safeParse(form.get("id")).data;
  const revision = Number(form.get("revision"));
  if (!id || !revision) redirect("/inventari?status=invalid");
  const { data, error } = await db.rpc("change_material_state", { material_id: id, expected_revision: revision, intent: "submit" });
  redirect(`/verifikimi/listimi/${id}?status=${error ? "failed" : data ? "submitted" : "conflict"}`);
}

const disputeInput = z.object({
  material_id: z.uuid().optional().or(z.literal("")).transform((v) => v || null),
  kind: z.enum(["wrong_description", "damaged", "missing_quantity", "counterfeit", "suspicious_seller", "missing_documents", "not_as_pictured", "safety", "delivery", "non_delivery", "other"]),
  description: z.string().trim().min(20).max(3000),
});

export async function openDispute(form: FormData) {
  const { db, user } = await requireAccount();
  const parsed = disputeInput.safeParse(Object.fromEntries([...form.entries()].filter(([k]) => k !== "file")));
  if (!parsed.success) redirect("/mbrojtja?status=invalid");
  const { data, error } = await db.from("disputes").insert(parsed.data).select("id").single();
  if (error || !data) redirect("/mbrojtja?status=failed");
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const checked = await checkFile(file);
    if (!("error" in checked)) {
      const path = storagePath(user.id, "dispute", checked.name);
      const up = await db.storage.from("verify-docs").upload(path, checked.bytes, { contentType: checked.mime });
      if (!up.error) await db.from("verification_documents").insert({ subject_type: "dispute", subject_id: data.id, doc_type: "evidence", storage_path: path, file_name: checked.name.slice(0, 200), mime_type: checked.mime, size_bytes: checked.size });
    }
  }
  redirect("/mbrojtja?status=opened");
}

export async function replyDispute(form: FormData) {
  const { db } = await requireAccount();
  const id = z.uuid().safeParse(form.get("dispute")).data;
  const body = z.string().trim().min(1).max(3000).safeParse(form.get("body")).data;
  if (!id || !body) redirect("/mbrojtja?status=invalid");
  await db.from("dispute_messages").insert({ dispute_id: id, body });
  redirect("/mbrojtja?status=sent");
}

export async function markNotificationsRead() {
  const { db, user } = await requireAccount();
  await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  redirect("/njoftimet");
}
