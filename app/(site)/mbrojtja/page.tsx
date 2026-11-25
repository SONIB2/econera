import type { Metadata } from "next";
import Link from "next/link";
import { openDispute, replyDispute } from "@/app/(site)/verify-actions";
import { ToolHeader } from "@/components/tools/tool-header";
import { Pill, StatusNotice } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { sessionDatabase } from "@/lib/supabase";
import { DISPUTE_KIND, DISPUTE_STATUS } from "@/lib/verify/labels";

export const metadata: Metadata = { title: "Mbrojtja e klientit", robots: { index: false } };

export default async function CustomerProtection({ searchParams }: { searchParams: Promise<{ status?: string; material?: string }> }) {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { status, material } = await searchParams;
  const db = await sessionDatabase();
  const user = db ? (await db.auth.getUser()).data.user : null;
  const { data: mine } = user && db ? await db.from("disputes").select("id,kind,description,status,resolution,created_at,dispute_messages(body,author_id,created_at)").order("created_at", { ascending: false }) : { data: null };
  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm";
  return (
    <>
      <ToolHeader hub="ECONERA Verify" hubHref="/verifikimi" name={t("Mbrojtja e klientit", "Customer protection")} title={t("Raporto një problem.", "Report a problem.")}
        lead={t("Përshkrim i gabuar, dëmtim, sasi që mungon, falsifikim, siguri ose dorëzim. Një oficer i mbrojtjes së klientit e shqyrton çdo rast.", "Wrong description, damage, missing quantity, counterfeit, safety or delivery. A customer protection officer reviews every case.")} />
      <div className="container-x grid gap-6 pb-20 lg:grid-cols-[1.1fr_1fr]">
        <div className="grid content-start gap-4">
          <StatusNotice status={status} lang={lang} />
          {!user ? (
            <div className="card p-6"><p>{t("Hyr për të hapur një ankesë.", "Log in to open a complaint.")}</p><Link href="/hyr?lloji=bleres" className="btn-primary mt-4">{t("Hyr", "Log in")}</Link></div>
          ) : (
            <form action={openDispute} className="card grid gap-4 p-5 md:p-7">
              <input type="hidden" name="material_id" value={material ?? ""} />
              <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Çfarë ndodhi?", "What happened?")}</span>
                <select name="kind" required className={input}>{Object.entries(DISPUTE_KIND).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Përshkruaje (të paktën 20 shkronja)", "Describe it (at least 20 characters)")}</span>
                <textarea name="description" required minLength={20} maxLength={3000} rows={5} className={input} /></label>
              <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Foto ose dokument si provë (opsionale)", "Photo or document as evidence (optional)")}</span>
                <input type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" /></label>
              {material && <p className="text-xs text-ink-2">{t("Ankesa lidhet me listimin që po shikoje.", "The complaint is linked to the listing you were viewing.")}</p>}
              <button className="btn-primary w-fit">{t("Dërgo ankesën", "Submit complaint")}</button>
              <p className="text-xs text-ink-2">{t("ECONERA nuk mban paratë e klientëve dhe nuk ofron escrow. Kthimet dhe rimbursimet trajtohen sipas politikës dhe ligjit në fuqi.", "ECONERA does not hold customer funds or offer escrow. Returns and refunds follow the policy and applicable law.")}</p>
            </form>
          )}
        </div>
        {user && (
          <section aria-labelledby="ankesat" className="grid content-start gap-3">
            <h2 id="ankesat" className="text-2xl">{t("Ankesat e mia", "My complaints")}</h2>
            {!mine?.length && <p className="text-sm text-ink-2">{t("Nuk ke ankesa.", "No complaints.")}</p>}
            {mine?.map((d) => (
              <article key={d.id} className="card p-4 text-sm">
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{DISPUTE_KIND[d.kind]?.[lang]}</span><Pill tone={d.status === "resolved" ? "ok" : d.status === "rejected" ? "err" : "warn"}>{DISPUTE_STATUS[d.status]?.[lang]}</Pill></div>
                <p className="mt-2 text-ink-2">{d.description}</p>
                {d.resolution && <p className="mt-2"><span className="font-medium">{t("Zgjidhja", "Resolution")}:</span> {d.resolution}</p>}
                {(d.dispute_messages as { body: string; author_id: string; created_at: string }[] | null)?.map((msg, i) => <p key={i} className={`mt-2 rounded-lg px-3 py-2 ${msg.author_id === user.id ? "bg-bg-2" : "bg-accent/60"}`}>{msg.body}</p>)}
                {!["resolved", "rejected"].includes(d.status) && (
                  <form action={replyDispute} className="mt-3 flex gap-2"><input type="hidden" name="dispute" value={d.id} /><input name="body" required maxLength={3000} placeholder={t("Shkruaj një mesazh", "Write a message")} className="min-w-0 flex-1 rounded-full border border-line bg-bg px-3 py-2" /><button className="btn-ghost">{t("Dërgo", "Send")}</button></form>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
