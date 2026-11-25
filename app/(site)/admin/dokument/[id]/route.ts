import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { currentStaff } from "@/lib/verify/staff";
import { sessionDatabase } from "@/lib/supabase";

/**
 * Opens a private verification document through a 60-second signed URL.
 * Staff (with MFA) or the document owner only; every opening is written to the audit log.
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id).data;
  if (!id) return new NextResponse("Not found", { status: 404 });
  const staff = await currentStaff();
  const db = staff.kind === "staff" ? staff.db : await sessionDatabase();
  if (!db) return new NextResponse("Unavailable", { status: 503 });
  const { data: doc } = await db.from("verification_documents").select("storage_path").eq("id", id).maybeSingle();
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const { data: logged } = await db.rpc("log_document_access", { document_id: id });
  if (!logged) return new NextResponse("Forbidden", { status: 403 });
  const { data, error } = await db.storage.from("verify-docs").createSignedUrl(doc.storage_path, 60);
  if (error || !data) return new NextResponse("Unavailable", { status: 503 });
  const res = NextResponse.redirect(data.signedUrl);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
