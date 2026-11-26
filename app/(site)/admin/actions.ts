"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/verify/staff";
import { checkFile, storagePath } from "@/lib/verify/files";

const id = z.uuid();
const CHECKLIST = ["photos_real", "description_matches", "specs_complete", "documents_match", "certificates_valid", "seller_checked", "risk_confirmed", "no_prohibited"] as const;

/** Every listing decision goes through verify_decide in PostgreSQL, which re-checks role, MFA, ownership, documents and dual approval. */
export async function decideListing(form: FormData) {
  const s = await requireStaff(["product_officer", "technical_reviewer", "customer_protection"]);
  const material = id.parse(form.get("material"));
  const decision = z.enum(["start", "approve", "reject", "request_info", "request_inspection", "escalate", "suspend", "reinstate", "set_risk"]).parse(form.get("decision"));
  const checklist = Object.fromEntries(CHECKLIST.map((k) => [k, form.get(`check_${k}`) === "on"]));
  const extra = { risk: form.get("risk") || undefined, kind: form.get("kind") || undefined, scope: form.get("scope") || undefined, lot: form.get("lot") || undefined, corrective_action: form.get("corrective_action") || undefined };
  const { data, error } = await s.db.rpc("verify_decide", {
    material_id: material, expected_revision: Number(form.get("revision")), decision,
    reason: String(form.get("reason") ?? "").slice(0, 2000), checklist, evidence: String(form.get("evidence") ?? "").slice(0, 2000) || null, extra,
  });
  const result = error ? "failed" : String(data);
  redirect(`/admin/listimet/${material}?r=${encodeURIComponent(result.startsWith("missing:") ? "missing" : result)}${result.startsWith("missing:") ? `&m=${encodeURIComponent(result.slice(8))}` : ""}`);
}

export async function reviewDocument(form: FormData) {
  const s = await requireStaff(["seller_officer", "product_officer", "technical_reviewer", "customer_protection"]);
  const doc = id.parse(form.get("document"));
  const back = String(form.get("back") ?? "/admin");
  const { data, error } = await s.db.rpc("review_document", { document_id: doc, verdict: form.get("verdict") === "accepted" ? "accepted" : "rejected", notes: String(form.get("notes") ?? "").slice(0, 500), registry_checked: form.get("registry_checked") === "on" });
  redirect(`${back.startsWith("/admin") ? back : "/admin"}?r=${error || !data ? "doc_failed" : "doc_ok"}`);
}

export async function decideSeller(form: FormData) {
  const s = await requireStaff(["seller_officer"]);
  const seller = id.parse(form.get("seller"));
  const { data, error } = await s.db.rpc("decide_seller_verification", { seller, decision: String(form.get("decision")), reason: String(form.get("reason") ?? "").slice(0, 2000) });
  redirect(`/admin/shitesit/${seller}?r=${error ? (error.message.includes("identity") ? "seller_docs" : "failed") : data ? "ok" : "invalid_state"}`);
}

export async function recordInspection(form: FormData) {
  const s = await requireStaff(["technical_reviewer"]);
  const inspection = id.parse(form.get("inspection"));
  const material = id.parse(form.get("material"));
  const file = form.get("report");
  if (!(file instanceof File)) redirect(`/admin/listimet/${material}?r=report_missing`);
  const checked = await checkFile(file);
  if ("error" in checked) redirect(`/admin/listimet/${material}?r=report_${checked.error}`);
  const path = storagePath(s.user.id, "inspection", checked.name);
  const up = await s.db.storage.from("verify-docs").upload(path, checked.bytes, { contentType: checked.mime });
  if (up.error) redirect(`/admin/listimet/${material}?r=storage`);
  const { data: doc, error } = await s.db.from("verification_documents").insert({ subject_type: "inspection", subject_id: inspection, doc_type: "inspection_report", storage_path: path, file_name: checked.name.slice(0, 200), mime_type: checked.mime, size_bytes: checked.size }).select("id").single();
  if (error || !doc) redirect(`/admin/listimet/${material}?r=failed`);
  const { data } = await s.db.rpc("record_inspection", {
    inspection_id: inspection, inspector: String(form.get("inspector") ?? ""), qualifications: String(form.get("qualifications") ?? ""), place: String(form.get("location") ?? ""),
    outcome: String(form.get("result") ?? ""), findings_text: String(form.get("findings") ?? ""), defects_text: String(form.get("defects") ?? ""), recommend: String(form.get("recommendation") ?? ""), report: doc.id,
  });
  redirect(`/admin/listimet/${material}?r=${data ? "inspection_ok" : "invalid_inspection"}`);
}

export async function updateDispute(form: FormData) {
  const s = await requireStaff(["customer_protection"]);
  const dispute = id.parse(form.get("dispute"));
  const assignee = form.get("assign_me") === "on" ? s.user.id : null;
  const { data } = await s.db.rpc("update_dispute", { dispute, next_status: String(form.get("status")), assignee, resolution_text: String(form.get("resolution") ?? ""), refund: (form.get("refund") as string) || null });
  redirect(`/admin/ankesat/${dispute}?r=${data ? "ok" : "invalid_state"}`);
}

export async function messageDispute(form: FormData) {
  const s = await requireStaff(["customer_protection", "support"]);
  const dispute = id.parse(form.get("dispute"));
  await s.db.from("dispute_messages").insert({ dispute_id: dispute, body: String(form.get("body") ?? "").slice(0, 3000), internal: form.get("internal") === "on" });
  redirect(`/admin/ankesat/${dispute}`);
}

export async function runExpiry() {
  const s = await requireStaff(["product_officer", "technical_reviewer"]);
  const { data } = await s.db.rpc("expire_listings");
  redirect(`/admin?r=expired&n=${Number(data ?? 0)}`);
}

/** Grants or removes a staff role. Looking up a user by email needs SUPABASE_SECRET_KEY (server only). */
export async function changeRole(form: FormData) {
  const s = await requireStaff(["super_admin"]);
  const role = z.enum(["super_admin", "seller_officer", "product_officer", "technical_reviewer", "customer_protection", "finance", "support"]).parse(form.get("role"));
  let target = z.uuid().safeParse(form.get("user")).data;
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase()).data;
  if (!target && email) {
    const key = process.env.SUPABASE_SECRET_KEY, url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!key || !url) redirect("/admin/stafi?r=no_secret");
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, key, { auth: { persistSession: false } });
    for (let page = 1; page <= 10 && !target; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      target = data?.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (!data || data.users.length < 200) break;
    }
  }
  if (!target) redirect("/admin/stafi?r=user_missing");
  const fn = form.get("op") === "revoke" ? "revoke_staff_role" : "grant_staff_role";
  const { data } = await s.db.rpc(fn, { target, wanted: role });
  redirect(`/admin/stafi?r=${data ? "ok" : "invalid_state"}`);
}

export async function saveRequirement(form: FormData) {
  const s = await requireStaff(["super_admin"]);
  const op = form.get("op");
  if (op === "toggle") {
    const rid = Number(form.get("id"));
    await s.db.from("verification_requirements").update({ active: form.get("active") === "true" }).eq("id", rid);
  } else {
    const row = z.object({
      country: z.string().regex(/^[A-Z]{2}$/), category: z.string().max(40).optional().transform((v) => v || null),
      risk_level: z.enum(["", "low", "medium", "high"]).transform((v) => v || null), intended_use: z.string().max(40).optional().transform((v) => v || null),
      doc_type: z.string().max(40), required: z.string().optional().transform((v) => v === "on"), note_sq: z.string().max(300).optional(), note_en: z.string().max(300).optional(),
    }).safeParse(Object.fromEntries(form));
    if (!row.success) redirect("/admin/rregullat?r=invalid");
    await s.db.from("verification_requirements").insert(row.data);
  }
  redirect("/admin/rregullat?r=ok");
}

/** Supabase TOTP multi-factor authentication for staff. */
export async function enrollMfa() {
  const { sessionDatabase } = await import("@/lib/supabase");
  const db = await sessionDatabase();
  if (!db) redirect("/hyr?status=unavailable");
  const { data, error } = await db.auth.mfa.enroll({ factorType: "totp", friendlyName: `ECONERA ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) redirect("/admin/mfa?r=failed");
  redirect(`/admin/mfa?factor=${data.id}&qr=${encodeURIComponent(data.totp.qr_code)}&secret=${encodeURIComponent(data.totp.secret)}`);
}

export async function verifyMfa(form: FormData) {
  const { sessionDatabase } = await import("@/lib/supabase");
  const db = await sessionDatabase();
  if (!db) redirect("/hyr?status=unavailable");
  const factorId = String(form.get("factor") ?? "");
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId, code });
  redirect(error ? `/admin/mfa?r=code&factor=${encodeURIComponent(factorId)}` : "/admin");
}

/* Partner management. Row Level Security re-checks the staff role (support or super admin, with MFA) on every write. */
const PARTNER_CATEGORY = z.enum(["supplier", "manufacturer", "construction", "architecture", "logistics", "institution", "other"]);
const back = (r: string) => redirect(`/admin/partneret?r=${r}`);

export async function reviewPartnerApplication(form: FormData) {
  const s = await requireStaff(["support"]);
  const lead = id.parse(form.get("lead"));
  const status = z.enum(["info_requested", "approved", "rejected"]).parse(form.get("status"));
  const note = String(form.get("note") ?? "").trim().slice(0, 1000) || null;
  const { error } = await s.db.from("leads").update({ status, review_note: note }).eq("id", lead).eq("source", "partner");
  back(error ? "failed" : "reviewed");
}

export async function savePartner(form: FormData) {
  const s = await requireStaff(["support"]);
  const parsed = z.object({
    name: z.string().trim().min(2).max(120), category: PARTNER_CATEGORY,
    description_sq: z.string().trim().max(600).optional(), description_en: z.string().trim().max(600).optional(),
    website: z.union([z.literal(""), z.string().trim().regex(/^https:\/\/\S{3,200}$/)]).optional(),
    confirmation_ref: z.string().trim().min(3).max(200), confirmed_on: z.iso.date(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) back("invalid");
  const p = parsed.data!;
  const partner = z.uuid().safeParse(form.get("partner")).data;
  const application = z.uuid().safeParse(form.get("application")).data ?? null;
  const authorized = form.get("logo_authorized") === "on";
  let logo_path: string | undefined;
  const file = form.get("logo");
  if (file instanceof File && file.size) {
    if (!authorized) back("logo_permission");
    const checked = await checkFile(file);
    if ("error" in checked || !["image/png", "image/jpeg", "image/webp"].includes(checked.mime) || checked.size > 1024 * 1024) back("logo_file");
    const ok = checked as Exclude<typeof checked, { error: string }>;
    logo_path = `${crypto.randomUUID()}.${ok.mime.split("/")[1].replace("jpeg", "jpg")}`;
    const up = await s.db.storage.from("partner-logos").upload(logo_path, ok.bytes, { contentType: ok.mime, upsert: false });
    if (up.error) back("storage");
  }
  const row = {
    name: p.name, category: p.category, description_sq: p.description_sq || null, description_en: p.description_en || null, website: p.website || null,
    confirmation_ref: p.confirmation_ref, confirmed_on: p.confirmed_on, logo_authorized: authorized, ...(logo_path ? { logo_path } : {}),
    ...(authorized ? {} : { logo_path: null }),
  };
  const { error } = partner
    ? await s.db.from("partners").update(row).eq("id", partner)
    : await s.db.from("partners").insert({ ...row, application_id: application });
  back(error ? "failed" : "saved");
}

export async function setPartnerPublished(form: FormData) {
  const s = await requireStaff(["support"]);
  const partner = id.parse(form.get("partner"));
  const { error } = await s.db.from("partners").update({ published: form.get("published") === "1" }).eq("id", partner);
  back(error ? "failed" : "saved");
}

export async function deletePartner(form: FormData) {
  const s = await requireStaff(["support"]);
  const partner = id.parse(form.get("partner"));
  const { data, error } = await s.db.from("partners").delete().eq("id", partner).eq("published", false).select("logo_path");
  const path = data?.[0]?.logo_path as string | null | undefined;
  if (path) await s.db.storage.from("partner-logos").remove([path]);
  back(error || !data?.length ? "failed" : "deleted");
}
