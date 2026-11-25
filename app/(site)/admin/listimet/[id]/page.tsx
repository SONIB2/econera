import Link from "next/link";
import { notFound } from "next/navigation";
import { decideListing, recordInspection, reviewDocument } from "@/app/(site)/admin/actions";
import { AiScreen } from "@/components/verify/ai-screen";
import { Pill } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { DECISION_RESULT, DOC_TYPES, INTENDED_USE, listingStatus, RISK, SELLER_STATUS } from "@/lib/verify/labels";
import { prescreen } from "@/lib/verify/prescreen";
import { hasRole, requireStaff } from "@/lib/verify/staff";

const CHECKS: [string, string, string][] = [
  ["photos_real", "Fotot janë reale dhe tregojnë lotin", "Photos are real and show the lot"],
  ["description_matches", "Përshkrimi përputhet me fotot dhe dokumentet", "Description matches photos and documents"],
  ["specs_complete", "Specifikimet (masat, trashësia, sasia) janë të plota", "Specifications (size, thickness, quantity) are complete"],
  ["documents_match", "Dokumentet i përkasin këtij produkti/loti", "Documents belong to this product/lot"],
  ["certificates_valid", "Certifikatat janë brenda afatit dhe fushës", "Certificates are in date and in scope"],
  ["seller_checked", "Statusi i shitësit u kontrollua", "Seller status checked"],
  ["risk_confirmed", "Klasa e rrezikut u konfirmua nga njeriu", "Risk class confirmed by a human"],
  ["no_prohibited", "Nuk ka shenja materiali të ndaluar/vjedhur/falsifikuar", "No sign of prohibited/stolen/counterfeit material"],
];

export default async function Workspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string; m?: string }> }) {
  const s = await requireStaff(["product_officer", "technical_reviewer", "customer_protection", "support"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { id } = await params;
  const p = await searchParams;
  const { data: m } = await s.db.from("materials").select("*").eq("id", id).maybeSingle();
  if (!m) notFound();
  const [{ data: docs }, { data: missing }, { data: decisions }, { data: versions }, { data: inspections }, { data: seller }, { data: siblings }, { data: suspensions }, { data: passport }] = await Promise.all([
    s.db.from("verification_documents").select("*").eq("subject_type", "material").eq("subject_id", id).order("created_at", { ascending: false }),
    s.db.rpc("missing_documents", { material: id }),
    s.db.from("review_decisions").select("*").eq("material_id", id).order("created_at", { ascending: false }),
    s.db.from("material_versions").select("revision,submitted_at,data").eq("material_id", id).order("revision", { ascending: false }),
    s.db.from("inspections").select("*").eq("material_id", id).order("requested_at", { ascending: false }),
    s.db.from("seller_verifications").select("user_id,kind,legal_name,status,country,registration_number,decided_at").eq("user_id", m.owner_id).maybeSingle(),
    s.db.from("materials").select("title").eq("owner_id", m.owner_id).neq("id", id),
    s.db.from("suspensions").select("*").eq("material_id", id).order("created_at", { ascending: false }),
    s.db.from("material_passports").select("code").eq("material_id", id).maybeSingle(),
  ]);
  const inspectionDocIds = (inspections ?? []).map((i) => i.id);
  const { data: inspectionDocs } = inspectionDocIds.length ? await s.db.from("verification_documents").select("*").eq("subject_type", "inspection").in("subject_id", inspectionDocIds) : { data: [] };
  const findings = prescreen({
    title: m.title, description: m.description, category: m.category, intended_use: m.intended_use ?? "non_structural", quantity: Number(m.quantity), unit: m.unit,
    thickness_mm: m.thickness_mm, batch_no: m.batch_no, manufacturer: m.manufacturer, known_defects: m.known_defects,
    documents: (docs ?? []).map((d) => ({ doc_type: d.doc_type, review_status: d.review_status, expires_on: d.expires_on, file_name: d.file_name })),
    missing: (missing as string[] | null) ?? [], sellerStatus: seller?.status ?? null, sameSellerTitles: (siblings ?? []).map((x) => x.title),
  });
  const own = m.owner_id === s.user.id;
  const canReview = hasRole(s.roles, ["product_officer", "technical_reviewer"]) && !own;
  const canTech = hasRole(s.roles, ["technical_reviewer"]);
  const open = inspections?.find((i) => !i.completed_at);
  const firstApproval = decisions?.find((d) => d.decision === "approve" && d.revision === m.revision);
  const result = p.r ? (p.r === "missing" ? { sq: `Miratimi u bllokua: mungojnë ${p.m}.`, en: `Approval blocked: missing ${p.m}.` } : DECISION_RESULT[p.r] ?? { sq: p.r, en: p.r }) : null;
  const fact = (k: string, v: unknown) => (v === null || v === undefined || v === "" ? null : <div key={k}><dt className="text-xs text-ink-2">{k}</dt><dd>{String(v)}</dd></div>);
  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";

  return (
    <div className="grid gap-5">
      <nav className="text-sm text-ink-2"><Link href="/admin/listimet" className="hover:text-ink">{t("Listimet", "Listings")}</Link> / {m.title}</nav>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="display text-4xl">{m.title}</h1>
        <Pill>{listingStatus(m.publication, m.moderation, Number(m.quantity))[lang]}</Pill>
        {m.risk_level && <Pill tone={RISK[m.risk_level]?.tone}>{RISK[m.risk_level]?.[lang]}</Pill>}
        <span className="text-sm text-ink-2">{t("Versioni", "Version")} {m.revision}{passport?.code ? ` · ${passport.code}` : ""}</span>
      </header>
      {result && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${p.r === "ok" || p.r?.endsWith("_ok") ? "border-line bg-accent/50" : "border-[#ecd29a] bg-[#fdf6e3]"}`}>{"sq" in result ? result[lang] : String(result)}</p>}
      {own && <p role="alert" className="rounded-xl border border-[#e8b7a8] bg-[#fdf0ec] px-4 py-3 text-sm">{t("Ky është listimi yt. Nuk mund ta shqyrtosh.", "This is your own listing. You cannot review it.")}</p>}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="grid content-start gap-5">
          <section className="card p-5" aria-labelledby="produkti">
            <h2 id="produkti" className="text-xl">{t("Produkti (deklaruar nga shitësi)", "Product (seller-declared)")}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              {[fact(t("Kategoria", "Category"), m.category), fact(t("Përdorimi", "Intended use"), INTENDED_USE[m.intended_use]?.[lang]), fact(t("Gjendja", "Condition"), m.condition),
                fact(t("Sasia", "Quantity"), `${m.quantity} ${m.unit}`), fact(t("Çmimi", "Price"), `${m.unit_price} ${m.currency}`), fact(t("Qarku", "Region"), m.region),
                fact(t("Prodhuesi", "Manufacturer"), m.manufacturer), fact(t("Modeli / ref.", "Model / ref."), m.model_ref), fact(t("Loti / batch", "Batch / lot"), m.batch_no),
                fact(t("Origjina", "Origin"), m.origin_country), fact(t("Mosha (vite)", "Age (years)"), m.age_years), fact(t("Ruajtja", "Storage"), m.storage_conditions),
                fact(t("Përmasat (mm)", "Dimensions (mm)"), m.length_mm ? `${m.length_mm} × ${m.width_mm} × ${m.thickness_mm}` : null), fact(t("Burimi", "Sourcing"), m.sourcing)]}
            </dl>
            <p className="mt-4 whitespace-pre-line text-sm">{m.description}</p>
            {m.known_defects && <p className="mt-3 rounded-lg bg-[#fdf6e3] px-3 py-2 text-sm"><span className="font-medium">{t("Defekte të njohura", "Known defects")}:</span> {m.known_defects}</p>}
          </section>

          <section className="card p-5" aria-labelledby="dokumentet">
            <h2 id="dokumentet" className="text-xl">{t("Fotot dhe dokumentet", "Photos and documents")}</h2>
            {!!(missing as string[] | null)?.length && <p className="mt-3 rounded-lg bg-[#fdf6e3] px-3 py-2 text-sm">{t("Të detyrueshme që mungojnë ose s'janë pranuar", "Mandatory, missing or not accepted")}: {(missing as string[]).map((x) => DOC_TYPES[x]?.[lang] ?? x).join(", ")}</p>}
            <ul className="mt-4 grid gap-3">
              {[...(docs ?? []), ...(inspectionDocs ?? [])].map((d) => (
                <li key={d.id} className="rounded-xl border border-line p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span><span className="font-medium">{DOC_TYPES[d.doc_type]?.[lang] ?? d.doc_type}</span> <span className="text-ink-2">· {d.file_name}</span></span>
                    <span className="flex items-center gap-2"><Pill tone={d.review_status === "accepted" ? "ok" : d.review_status === "rejected" ? "err" : "warn"}>{d.review_status}</Pill><a href={`/admin/dokument/${d.id}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-lime underline underline-offset-4">{t("Hap (link 60 s)", "Open (60 s link)")}</a></span>
                  </div>
                  <p className="mt-1 text-xs text-ink-2">{[d.issuer, d.reference_no, d.issued_on && `${t("lëshuar", "issued")} ${d.issued_on}`, d.expires_on && `${t("skadon", "expires")} ${d.expires_on}`, d.registry_checked && t("kontrolluar në regjistër", "registry checked")].filter(Boolean).join(" · ")}</p>
                  {canReview && d.review_status === "pending" && d.owner_id !== s.user.id && (
                    <form action={reviewDocument} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="document" value={d.id} /><input type="hidden" name="back" value={`/admin/listimet/${id}`} />
                      <input name="notes" placeholder={t("Shënim (çfarë u kontrollua)", "Note (what was checked)")} className="min-w-48 flex-1 rounded-lg border border-line bg-bg px-3 py-1.5" />
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="registry_checked" />{t("Verifikuar te lëshuesi/regjistri", "Verified with issuer/registry")}</label>
                      <button name="verdict" value="accepted" className="rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-bg">{t("Prano", "Accept")}</button>
                      <button name="verdict" value="rejected" className="rounded-full border border-line px-3 py-1.5 text-xs">{t("Refuzo", "Reject")}</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-2">{t("Një PDF i ngarkuar nuk e provon vërtetësinë e certifikatës. Shëno \"verifikuar te lëshuesi\" vetëm pasi ta kesh kontrolluar.", "An uploaded PDF does not prove a certificate is genuine. Tick \"verified with issuer\" only after you checked it.")}</p>
          </section>

          <section className="card p-5" aria-labelledby="shitesi">
            <h2 id="shitesi" className="text-xl">{t("Shitësi", "Seller")}</h2>
            {seller ? <p className="mt-2 text-sm">{seller.legal_name} · {seller.kind === "business" ? t("Biznes", "Business") : t("Individ", "Individual")} · {seller.country}{seller.registration_number ? ` · ${seller.registration_number}` : ""} · <Pill tone={seller.status === "approved" ? "ok" : "warn"}>{SELLER_STATUS[seller.status]?.[lang]}</Pill> {hasRole(s.roles, ["seller_officer"]) && <Link href={`/admin/shitesit/${seller.user_id}`} className="text-lime underline">{t("Hap rastin", "Open case")}</Link>}</p>
              : <p className="mt-2 text-sm text-ink-2">{t("Shitësi nuk ka nisur verifikimin.", "The seller has not started verification.")}</p>}
          </section>

          {!!versions?.length && (
            <details className="card p-5"><summary className="cursor-pointer text-xl">{t("Versionet e mëparshme", "Previous versions")} ({versions.length})</summary>
              <ul className="mt-3 grid gap-2 text-xs">{versions.map((v) => <li key={v.revision} className="rounded-lg bg-bg-2 p-3"><span className="font-semibold">v{v.revision}</span> · {new Date(v.submitted_at).toLocaleString("en-GB")}<pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{JSON.stringify(Object.fromEntries(Object.entries(v.data as Record<string, unknown>).filter(([k]) => ["title", "description", "quantity", "unit_price", "condition", "intended_use", "batch_no", "manufacturer"].includes(k))), null, 1)}</pre></li>)}</ul>
            </details>
          )}
        </div>

        <div className="grid content-start gap-5">
          <section className="card p-5" aria-labelledby="paraprake">
            <h2 id="paraprake" className="text-xl">{t("Kontroll paraprak (automatik)", "Preliminary screening (automatic)")}</h2>
            <p className="mt-1 text-xs text-ink-2">{t("Ndihmë për shqyrtuesin, jo vendim.", "A hint for the reviewer, not a decision.")}</p>
            <ul className="mt-3 grid gap-1.5 text-sm">{findings.map((f, i) => <li key={i} className={`rounded-lg px-3 py-2 ${f.level === "block" ? "bg-[#fde8e4]" : f.level === "warn" ? "bg-[#fdf6e3]" : "bg-bg-2"}`}>{f[lang]}</li>)}{!findings.length && <li className="text-ink-2">{t("Asnjë sinjal.", "No signals.")}</li>}</ul>
            <AiScreen materialId={id} />
          </section>

          {canReview && (
            <section className="card p-5" aria-labelledby="vendimi">
              <h2 id="vendimi" className="text-xl">{t("Vendimi", "Decision")}</h2>
              {firstApproval && <p className="mt-2 rounded-lg bg-accent/50 px-3 py-2 text-sm">{t("Miratimi i parë u dha. Duhet një shqyrtues tjetër.", "First approval given. Another reviewer is needed.")}</p>}
              <form action={decideListing} className="mt-3 grid gap-3">
                <input type="hidden" name="material" value={id} /><input type="hidden" name="revision" value={m.revision} />
                <fieldset className="grid gap-1.5 text-sm"><legend className="mb-1 font-medium">{t("Lista e kontrollit", "Checklist")}</legend>
                  {CHECKS.map(([k, sq, en]) => <label key={k} className="flex items-start gap-2"><input type="checkbox" name={`check_${k}`} className="mt-0.5 size-4 accent-[var(--color-lime)]" />{lang === "en" ? en : sq}</label>)}
                </fieldset>
                <label className="grid gap-1 text-sm"><span className="font-medium">{t("Arsyeja (e detyrueshme, i shkon shitësit)", "Reason (required, sent to the seller)")}</span><textarea name="reason" required minLength={5} rows={3} className={input} /></label>
                <label className="grid gap-1 text-sm"><span className="font-medium">{t("Provat që mbështesin vendimin (të brendshme)", "Evidence supporting the decision (internal)")}</span><textarea name="evidence" rows={2} className={input} placeholder={t("p.sh. DoP nr. 123 i kontrolluar te prodhuesi më 25.11", "e.g. DoP no. 123 checked with manufacturer on 25.11")} /></label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="grid gap-1"><span>{t("Rreziku", "Risk")}</span><select name="risk" defaultValue={m.risk_level ?? ""} className={input}><option value="">—</option>{Object.entries(RISK).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select></label>
                  <label className="grid gap-1"><span>{t("Lloji i pezullimit", "Suspension type")}</span><select name="kind" className={input}><option value="other">{t("Tjetër", "Other")}</option><option value="unsafe">{t("I pasigurt", "Unsafe")}</option><option value="recall">{t("Tërheqje (recall)", "Recall")}</option><option value="fraud">{t("Mashtrim", "Fraud")}</option><option value="non_compliant">{t("Jo në përputhje", "Non-compliant")}</option></select></label>
                  <label className="col-span-2 grid gap-1"><span>{t("Inspektimi: fusha dhe loti", "Inspection: scope and lot")}</span><div className="flex gap-2"><input name="scope" placeholder={t("Fusha e inspektimit", "Inspection scope")} className={input} /><input name="lot" defaultValue={m.batch_no ?? ""} placeholder={t("Loti", "Lot")} className={`${input} w-32`} /></div></label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.moderation === "pending" && <button name="decision" value="start" className="btn-ghost">{t("Merr rastin", "Take case")}</button>}
                  <button name="decision" value="approve" className="btn-primary">{t("Mirato", "Approve")}</button>
                  <button name="decision" value="request_info" className="btn-ghost">{t("Kërko të dhëna", "Request information")}</button>
                  <button name="decision" value="request_inspection" className="btn-ghost">{t("Kërko inspektim", "Request inspection")}</button>
                  <button name="decision" value="escalate" className="btn-ghost">{t("Te specialisti", "Escalate")}</button>
                  <button name="decision" value="set_risk" className="btn-ghost">{t("Vendos rrezikun", "Set risk")}</button>
                  <button name="decision" value="reject" className="btn-ghost border-[#e8b7a8] text-[#8a2f1d]">{t("Refuzo", "Reject")}</button>
                  {m.publication === "published" && <button name="decision" value="suspend" className="btn-ghost border-[#b5543a] text-[#8a2f1d]">{t("Pezullo", "Suspend")}</button>}
                  {m.publication === "suspended" && <button name="decision" value="reinstate" className="btn-ghost">{t("Kthe në shqyrtim", "Back to review")}</button>}
                </div>
                {m.risk_level === "high" && <p className="text-xs text-ink-2">{t("Rrezik i lartë: kërkohen dy miratime nga shqyrtues të ndryshëm dhe shitës i verifikuar.", "High risk: two approvals from different reviewers and a verified seller are required.")}</p>}
              </form>
            </section>
          )}

          {open && canTech && (
            <section className="card p-5" aria-labelledby="inspektimi">
              <h2 id="inspektimi" className="text-xl">{t("Regjistro inspektimin", "Record inspection")}</h2>
              <p className="mt-1 text-sm text-ink-2">{t("Fusha", "Scope")}: {open.scope} · {t("Loti", "Lot")}: {open.lot_ref}</p>
              <form action={recordInspection} className="mt-3 grid gap-2 text-sm">
                <input type="hidden" name="inspection" value={open.id} /><input type="hidden" name="material" value={id} />
                <input name="inspector" required placeholder={t("Inspektori", "Inspector")} className={input} />
                <input name="qualifications" required placeholder={t("Kualifikimi / licenca", "Qualification / licence")} className={input} />
                <input name="location" placeholder={t("Vendi i inspektimit", "Inspection location")} className={input} />
                <div className="grid grid-cols-2 gap-2">
                  <select name="result" required className={input}><option value="pass">{t("Kaloi", "Pass")}</option><option value="restricted">{t("Me kufizime", "Restricted")}</option><option value="fail">{t("Nuk kaloi", "Fail")}</option></select>
                  <select name="recommendation" required className={input}><option value="approve">{t("Rekomandim: mirato", "Recommend: approve")}</option><option value="restrict">{t("Rekomandim: kufizo", "Recommend: restrict")}</option><option value="reject">{t("Rekomandim: refuzo", "Recommend: reject")}</option></select>
                </div>
                <textarea name="findings" rows={2} placeholder={t("Gjetjet", "Findings")} className={input} />
                <textarea name="defects" rows={2} placeholder={t("Defektet", "Defects")} className={input} />
                <label className="grid gap-1"><span className="font-medium">{t("Raporti i inspektimit (PDF/foto, i detyrueshëm)", "Inspection report (PDF/photo, required)")}</span><input type="file" name="report" required accept="application/pdf,image/jpeg,image/png,image/webp" /></label>
                <button className="btn-primary w-fit">{t("Ruaj inspektimin", "Save inspection")}</button>
                <p className="text-xs text-ink-2">{t("Raporti duhet pranuar nga një shqyrtues tjetër që të vlejë për miratim.", "Another reviewer must accept the report before it counts for approval.")}</p>
              </form>
            </section>
          )}

          <section className="card p-5" aria-labelledby="historia">
            <h2 id="historia" className="text-xl">{t("Historiku", "History")}</h2>
            <ol className="mt-3 grid gap-2 text-sm">
              {suspensions?.map((x) => <li key={`s${x.id}`} className="rounded-lg bg-[#fde8e4] px-3 py-2">{t("Pezullim", "Suspension")} ({x.kind}) · {new Date(x.created_at).toLocaleDateString("en-GB")}: {x.reason}{x.lifted_at ? ` · ${t("hequr", "lifted")} ${new Date(x.lifted_at).toLocaleDateString("en-GB")}` : ""}</li>)}
              {inspections?.map((i) => <li key={i.id} className="rounded-lg bg-bg-2 px-3 py-2">{t("Inspektim", "Inspection")} · {i.completed_at ? `${i.result} · ${i.inspector_name} (${i.inspector_qualifications})` : t("në pritje", "pending")} · {i.scope}</li>)}
              {decisions?.map((d) => <li key={d.id} className="rounded-lg border border-line px-3 py-2"><span className="font-medium">{d.decision}</span> · v{d.revision} · {new Date(d.created_at).toLocaleString("en-GB")}{d.reviewer_id === s.user.id ? ` · ${t("ti", "you")}` : ""}<span className="block">{d.reason}</span>{d.evidence && <span className="block text-xs text-ink-2">{t("Prova", "Evidence")}: {d.evidence}</span>}</li>)}
              {!decisions?.length && !inspections?.length && <li className="text-ink-2">{t("Asnjë vendim ende.", "No decisions yet.")}</li>}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
