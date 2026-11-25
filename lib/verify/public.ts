import "server-only";
import { publicDatabase } from "@/lib/supabase";

export type PublicVerification = {
  material_id: string; passport_code: string | null; passport_issued_at: string | null; revision: number; risk_level: string;
  manufacturer: string | null; model_ref: string | null; batch_no: string | null; origin_country: string | null; age_years: number | null;
  storage_conditions: string | null; intended_use: string; known_defects: string | null; reviewed_at: string | null; approvals: number;
  identity_verified: boolean | null; business_verified: boolean | null; business_name: string | null;
  documents: { type: string; issuer: string | null; reference: string | null; expires_on: string | null; registry_checked: boolean }[];
  inspection: { result: string; scope: string; lot: string; date: string; qualifications: string } | null;
  independent_certified: boolean;
};

export async function readVerification(id: string) {
  const db = publicDatabase();
  if (!db) return null;
  const [{ data: v }, { data: m }] = await Promise.all([
    db.from("public_verification").select("*").eq("material_id", id).maybeSingle<PublicVerification>(),
    db.from("public_catalogue").select("id,title,description,category,region,condition,unit,quantity,unit_price,currency,seller_label,length_mm,width_mm,thickness_mm,sheet_material").eq("id", id).maybeSingle(),
  ]);
  return v && m ? { v, m } : null;
}

export async function idForPassport(code: string) {
  const db = publicDatabase();
  if (!db) return null;
  const { data } = await db.from("public_verification").select("material_id").eq("passport_code", code).maybeSingle<{ material_id: string }>();
  return data?.material_id ?? null;
}
