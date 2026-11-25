import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { submitListing } from "@/app/(site)/verify-actions";
import { ToolHeader } from "@/components/tools/tool-header";
import { DocList, DocUpload, Pill, StatusNotice } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { requireAccount } from "@/lib/supabase";
import { DOC_TYPES, INTENDED_USE, listingStatus, MODERATION, PRODUCT_DOC_TYPES, RISK } from "@/lib/verify/labels";

export const metadata: Metadata = { title: "Verifikimi i listimit", robots: { index: false } };

type M = { id: string; title: string; revision: number; publication: string; moderation: string; quantity: number; category: string; intended_use?: string; risk_level?: string | null };

export default async function ListingVerification({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const { db, user } = await requireAccount();
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { id } = await params;
  const { status } = await searchParams;
  const { data: m } = await db.from("materials").select("id,title,revision,publication,moderation,quantity,category,intended_use,risk_level").eq("id", id).eq("owner_id", user.id).maybeSingle<M>();
  if (!m) notFound();
  const [{ data: docs }, { data: missing }, { data: decisions }, { data: reqs }] = await Promise.all([
    db.from("verification_documents").select("id,doc_type,file_name,review_status,expires_on,review_notes,created_at").eq("subject_type", "material").eq("subject_id", id).order("created_at", { ascending: false }),
    db.rpc("missing_documents", { material: id }),
    db.from("review_decisions").select("decision,reason,created_at").eq("material_id", id).order("created_at", { ascending: false }).limit(10),
    db.from("verification_requirements").select("doc_type,required,risk_level,intended_use,category,note_sq,note_en").eq("active", true).eq("country", "AL"),
  ]);
  const risk = m.risk_level ?? null;
  const st = listingStatus(m.publication, m.moderation, m.quantity);
  const canSubmit = m.publication === "draft" && ["unreviewed", "rejected", "info_required"].includes(m.moderation);
  const applicable = (reqs ?? []).filter((r) => (!r.category || r.category === m.category) && (!r.intended_use || r.intended_use === m.intended_use) && (!r.risk_level || r.risk_level === (risk ?? (["structural", "fire_safety", "electrical", "pressure"].includes(m.intended_use ?? "") ? "high" : ["metal", "guri", "dyer", "izolim"].includes(m.category) ? "medium" : "low"))));
  const decisionLabel: Record<string, [string, string]> = { approve: ["Miratim", "Approval"], reject: ["Refuzim", "Rejection"], request_info: ["Kërkohen të dhëna", "Information requested"], request_inspection: ["Kërkohet inspektim", "Inspection requested"], escalate: ["Te specialisti", "Escalated"], suspend: ["Pezullim", "Suspension"], reinstate: ["Rikthim në shqyrtim", "Back to review"], start: ["Shqyrtimi filloi", "Review started"], set_risk: ["Rreziku u vendos", "Risk set"] };
  return (
    <>
      <ToolHeader hub="ECONERA Verify" hubHref="/verifikimi" name={t("Verifikimi i listimit", "Listing verification")} title={m.title} lead={t("Asnjë listim nuk publikohet pa miratimin e një personi të autorizuar të ECONERA-s.", "No listing is published without approval by an authorised ECONERA person.")} />
      <div className="container-x grid gap-6 pb-20">
        <StatusNotice status={status} lang={lang} />
        <div className="card flex flex-wrap items-center gap-3 p-5 text-sm">
          <span>{t("Statusi", "Status")}: <Pill tone={m.publication === "published" ? "ok" : ["rejected", "suspended"].includes(m.moderation) ? "err" : "warn"}>{st[lang]}</Pill></span>
          {risk && <Pill tone={RISK[risk]?.tone}>{RISK[risk]?.[lang]}</Pill>}
          {m.intended_use && <span className="text-ink-2">{INTENDED_USE[m.intended_use]?.[lang]}</span>}
          <span className="text-ink-2">{t("Versioni", "Version")} {m.revision}</span>
          <Link href={`/inventari/${m.id}`} className="ml-auto text-lime underline underline-offset-4">{t("Ndrysho të dhënat", "Edit details")}</Link>
        </div>
        <section className="card grid gap-4 p-5 md:p-7" aria-labelledby="kerkesat">
          <h2 id="kerkesat" className="text-2xl">{t("Çfarë kërkohet për këtë material", "What this material needs")}</h2>
          <ul className="grid gap-2 text-sm">
            {[...new Map(applicable.map((r) => [r.doc_type, r])).values()].map((r) => {
              const miss = (missing as string[] | null)?.includes(r.doc_type);
              return <li key={r.doc_type} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-bg-2/60 px-3 py-2"><span><span className="font-medium">{DOC_TYPES[r.doc_type]?.[lang]}</span> <span className="text-ink-2">· {lang === "en" ? r.note_en : r.note_sq}</span></span>{r.required ? (miss ? <Pill tone="warn">{t("Mungon / pa pranuar", "Missing / not accepted")}</Pill> : <Pill tone="ok">{t("Plotësuar", "Done")}</Pill>) : <Pill>{t("Opsional", "Optional")}</Pill>}</li>;
            })}
          </ul>
          <p className="text-xs text-ink-2">{t("Kërkesat varen nga kategoria, përdorimi dhe rreziku. Stafi mund të kërkojë dokumente të tjera.", "Requirements depend on category, intended use and risk. Staff may ask for more.")}</p>
        </section>
        <section className="card grid gap-4 p-5 md:p-7" aria-labelledby="dokumentet">
          <h2 id="dokumentet" className="text-2xl">{t("Dokumentet dhe fotot", "Documents and photos")}</h2>
          <DocList docs={docs ?? []} lang={lang} />
          {m.publication !== "suspended" && <DocUpload lang={lang} subjectType="material" subjectId={m.id} types={PRODUCT_DOC_TYPES} back={`/verifikimi/listimi/${m.id}`} required={(missing as string[] | null) ?? []} />}
          {canSubmit && (
            <form action={submitListing} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={m.id} /><input type="hidden" name="revision" value={m.revision} />
              <button className="btn-primary">{m.moderation === "info_required" ? t("Ridorëzo për shqyrtim", "Resubmit for review") : t("Dërgo për shqyrtim", "Submit for review")}</button>
              <span className="text-sm text-ink-2">{t("Pas dorëzimit, një person i ECONERA-s e shqyrton listimin.", "After submitting, an ECONERA person reviews the listing.")}</span>
            </form>
          )}
        </section>
        {!!decisions?.length && (
          <section className="card p-5 md:p-7" aria-labelledby="historiku">
            <h2 id="historiku" className="text-2xl">{t("Historiku i shqyrtimit", "Review history")}</h2>
            <ol className="mt-4 grid gap-2 text-sm">{decisions.map((d, i) => <li key={i} className="rounded-lg border border-line px-3 py-2"><span className="font-medium">{decisionLabel[d.decision]?.[lang === "en" ? 1 : 0] ?? MODERATION[d.decision]?.[lang] ?? d.decision}</span> · <span className="text-ink-2">{new Date(d.created_at).toLocaleDateString("en-GB")}</span><span className="block">{d.reason}</span></li>)}</ol>
          </section>
        )}
      </div>
    </>
  );
}
