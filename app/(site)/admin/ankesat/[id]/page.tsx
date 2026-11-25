import Link from "next/link";
import { notFound } from "next/navigation";
import { messageDispute, updateDispute } from "@/app/(site)/admin/actions";
import { DocList, Pill } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { DISPUTE_KIND, DISPUTE_STATUS } from "@/lib/verify/labels";
import { hasRole, requireStaff } from "@/lib/verify/staff";

export default async function DisputeCase({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string }> }) {
  const s = await requireStaff(["customer_protection", "support"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { id } = await params;
  const { r } = await searchParams;
  const { data: d } = await s.db.from("disputes").select("*").eq("id", id).maybeSingle();
  if (!d) notFound();
  const [{ data: msgs }, { data: docs }] = await Promise.all([
    s.db.from("dispute_messages").select("body,internal,created_at,author_id").eq("dispute_id", id).order("created_at"),
    s.db.from("verification_documents").select("id,doc_type,file_name,review_status,expires_on,review_notes,created_at").eq("subject_type", "dispute").eq("subject_id", id),
  ]);
  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center gap-3"><h1 className="display text-4xl">{DISPUTE_KIND[d.kind]?.[lang]}</h1><Pill tone={d.status === "resolved" ? "ok" : "warn"}>{DISPUTE_STATUS[d.status]?.[lang]}</Pill></header>
      {r && <p role="status" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{r === "ok" ? t("U përditësua.", "Updated.") : t("Veprimi nuk u lejua (zgjidhja kërkon arsye).", "Not allowed (a resolution needs a reason).")}</p>}
      <section className="card p-5 text-sm"><p className="whitespace-pre-line">{d.description}</p>{d.material_id && <p className="mt-3"><Link href={`/admin/listimet/${d.material_id}`} className="text-lime underline">{t("Hap listimin", "Open listing")}</Link></p>}</section>
      <section className="card grid gap-3 p-5"><h2 className="text-xl">{t("Provat", "Evidence")}</h2><DocList docs={docs ?? []} lang={lang} staffLinks /></section>
      <section className="card grid gap-3 p-5"><h2 className="text-xl">{t("Komunikimi", "Messages")}</h2>
        {msgs?.map((m, i) => <p key={i} className={`rounded-lg px-3 py-2 text-sm ${m.internal ? "bg-[#fdf6e3]" : m.author_id === d.reporter_id ? "bg-bg-2" : "bg-accent/60"}`}>{m.internal && <span className="mr-1 font-medium">{t("[i brendshëm]", "[internal]")}</span>}{m.body}</p>)}
        <form action={messageDispute} className="grid gap-2"><input type="hidden" name="dispute" value={id} /><textarea name="body" required rows={2} className={input} placeholder={t("Mesazh për klientin ose shënim i brendshëm", "Message to the customer or internal note")} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="internal" />{t("Shënim i brendshëm (klienti s'e sheh)", "Internal note (customer cannot see)")}</label><button className="btn-ghost w-fit">{t("Dërgo", "Send")}</button></form>
      </section>
      {hasRole(s.roles, ["customer_protection"]) && (
        <form action={updateDispute} className="card grid gap-3 p-5 md:grid-cols-2"><input type="hidden" name="dispute" value={id} />
          <label className="grid gap-1 text-sm"><span className="font-medium">{t("Statusi", "Status")}</span><select name="status" defaultValue={d.status} className={input}>{Object.entries(DISPUTE_STATUS).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">{t("Rimbursimi", "Refund")}</span><select name="refund" defaultValue={d.refund_status ?? ""} className={input}><option value="">—</option><option value="requested">{t("Kërkuar", "Requested")}</option><option value="approved">{t("Miratuar (jashtë platformës)", "Approved (outside platform)")}</option><option value="declined">{t("Refuzuar", "Declined")}</option><option value="not_applicable">{t("Nuk aplikohet", "Not applicable")}</option></select></label>
          <label className="grid gap-1 text-sm md:col-span-2"><span className="font-medium">{t("Zgjidhja / arsyeja", "Resolution / reason")}</span><textarea name="resolution" rows={2} defaultValue={d.resolution ?? ""} className={input} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="assign_me" />{t("Caktoje tek unë", "Assign to me")}</label>
          <button className="btn-primary w-fit">{t("Ruaj", "Save")}</button>
          <p className="text-xs text-ink-2 md:col-span-2">{t("ECONERA nuk mban fondet e klientëve; rimbursimet kryhen nga shitësi ose ofruesi i pagesave.", "ECONERA does not hold customer funds; refunds are made by the seller or payment provider.")}</p>
        </form>
      )}
    </div>
  );
}
