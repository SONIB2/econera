import type { Metadata } from "next";
import Link from "next/link";
import { SellWizard } from "@/components/market/sell-wizard";
import { SellVisual } from "@/components/sell/sell-visual";
import { tr, type Lang } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { sessionDatabase } from "@/lib/supabase";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Shit materiale", "Sell materials"), description: tr(lang, "Ktheji materialet e tepërta, të rikuperuara ose copat në vlerë. Çdo listim shqyrtohet nga ECONERA.", "Turn surplus, reclaimed or offcut materials into value. Every listing is reviewed by ECONERA.") };
}

type SellerStatus = "none" | "draft" | "submitted" | "under_review" | "info_required" | "approved" | "rejected" | "revoked" | "unknown";

/**
 * Sell adapts to the visitor:
 * - not signed in → landing page (Create seller account / Log in);
 * - signed in, no seller verification yet → become a seller (individual or business), using the same account;
 * - verification submitted → pending status; private drafts allowed, submission for review locked;
 * - more information needed / rejected → reviewer note and link back to the verification form;
 * - revoked → suspended notice with support contact;
 * - approved → the six-step listing wizard directly.
 * The database enforces the same rule (migration 0010): only approved sellers can submit listings for review.
 */
export default async function Sell() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const db = await sessionDatabase();
  const user = db ? (await db.auth.getUser()).data.user : null;

  if (!user) return <Landing lang={lang} />;

  let status: SellerStatus = "none";
  let note: string | null = null;
  if (db) {
    const { data, error } = await db.from("seller_verifications").select("status, decision_reason").eq("user_id", user.id).maybeSingle<{ status: SellerStatus; decision_reason: string | null }>();
    if (error) status = "unknown"; else if (data) { status = data.status; note = data.decision_reason; }
  }

  const head = (title: string, lead: string) => (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold tracking-wide text-[#4c8a1f]">{t("SHIT NË ECONERA", "SELL ON ECONERA")}</p>
      <h1 className="display mt-2 text-4xl text-[#0c2f2b] md:text-5xl dark:text-ink">{title}</h1>
      <p className="mt-3 text-lg text-ink-2">{lead}</p>
    </div>
  );

  // Verified seller: straight to the wizard.
  if (status === "approved" || status === "unknown") {
    return (
      <div className="container-x pt-10 pb-20">
        {head(t("Listo një material.", "List a material."), t("Gjashtë hapa të shkurtër. Çdo listim publikohet vetëm pasi e shqyrton një person nga ECONERA.", "Six short steps. Every listing goes live only after a person at ECONERA reviews it."))}
        <div className="mt-8"><SellWizard /></div>
      </div>
    );
  }

  if (status === "revoked") {
    return (
      <div className="container-x pt-10 pb-24">
        {head(t("Llogaria e shitësit është pezulluar.", "Your seller account is suspended."), t("Listimet e tua nuk shfaqen në treg ndërkohë.", "Your listings are not shown on the marketplace in the meantime."))}
        <StatusCard tone="err" label={t("Pezulluar", "Suspended")} note={note} lang={lang} />
        <div className="mt-6 flex flex-wrap gap-2"><Link href="/kontakt" className="btn-primary">{t("Kontakto mbështetjen", "Contact support")}</Link><Link href="/verifikimi" className="btn-ghost">{t("Shiko verifikimin", "View verification")}</Link></div>
      </div>
    );
  }

  if (status === "none" || status === "draft") {
    return (
      <div className="container-x pt-10 pb-24">
        {head(t("Bëhu shitës me llogarinë tënde.", "Become a seller with your account."), t("Nuk ke nevojë për llogari të re. Zgjidh si shet dhe plotëso verifikimin; një person nga ECONERA e shqyrton.", "No new account needed. Choose how you sell and complete verification; a person at ECONERA reviews it."))}
        <StatusCard tone="warn" label={status === "draft" ? t("Verifikimi i papërfunduar", "Verification in progress") : t("Kërkohet verifikim", "Verification required")} note={null} lang={lang} />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Choice href="/verifikimi?lloji=individual" title={t("Shitës individ", "Individual seller")} text={t("Për persona privatë që shesin materialet e tyre të tepërta ose të ripërdorshme.", "For private individuals selling their own surplus or reusable construction materials.")} icon="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
          <Choice href="/verifikimi?lloji=business" title={t("Shitës biznes", "Business seller")} text={t("Për kompani ndërtimi, furnitorë, prodhues, depo, kontraktorë dhe shitës profesionistë.", "For construction companies, suppliers, manufacturers, warehouses, contractors and other professional sellers.")} icon="M4 20.5V8l8-4.5L20 8v12.5M9 20.5v-5h6v5M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
        </div>
        <Steps lang={lang} done={1} />
        <Drafts lang={lang} />
      </div>
    );
  }

  // submitted / under_review / info_required / rejected
  const pending = status === "submitted" || status === "under_review";
  return (
    <div className="container-x pt-10 pb-20">
      {head(pending ? t("Verifikimi është në shqyrtim.", "Your verification is under review.") : status === "info_required" ? t("Duhen disa të dhëna shtesë.", "A few more details are needed.") : t("Verifikimi nuk u miratua.", "Your verification was not approved."),
        pending ? t("Një person nga ECONERA po kontrollon të dhënat. Ndërkohë mund të përgatisësh skica private; dërgimi për shqyrtim hapet pas miratimit.", "A person at ECONERA is checking your details. Meanwhile you can prepare private drafts; submitting for review opens after approval.")
          : t("Shiko shënimin e shqyrtuesit, përditëso të dhënat dhe dërgoje sërish.", "Read the reviewer's note, update your details and send it again."))}
      <StatusCard tone={pending ? "warn" : "err"} label={pending ? t("Në shqyrtim", "Pending review") : status === "info_required" ? t("Kërkohen të dhëna shtesë", "Additional information required") : t("Refuzuar", "Rejected")} note={note} lang={lang} />
      <div className="mt-4"><Link href="/verifikimi" className="btn-ghost">{pending ? t("Shiko verifikimin", "View verification") : t("Përditëso verifikimin", "Update verification")}</Link></div>
      <h2 className="mt-12 text-2xl">{t("Përgatit një skicë private", "Prepare a private draft")}</h2>
      <div className="mt-5"><SellWizard canSubmit={false} /></div>
    </div>
  );
}

function StatusCard({ tone, label, note, lang }: { tone: "warn" | "err"; label: string; note: string | null; lang: Lang }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-4">
      <span className="text-sm text-ink-2">{t("Statusi i shitësit", "Seller status")}:</span>
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone === "err" ? "bg-[#fde8e4] text-[#8a2b1a]" : "bg-[#fff4d6] text-[#7a5a0c]"}`}>{label}</span>
      {note && <span className="w-full text-sm text-ink-2">{t("Shënimi i shqyrtuesit", "Reviewer note")}: {note}</span>}
    </div>
  );
}

function Choice({ href, title, text, icon }: { href: string; title: string; text: string; icon: string }) {
  return (
    <Link href={href} className="group flex gap-4 rounded-2xl border border-line bg-card p-5 transition hover:border-[#7fae2c] hover:shadow-[0_14px_34px_-22px_rgba(12,47,43,0.45)]">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eef8dc] text-[#3f7a17]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={icon} /></svg></span>
      <span><span className="block text-lg font-semibold">{title} <span aria-hidden className="text-[#4c8a1f] transition group-hover:ml-1">→</span></span><span className="mt-1 block text-sm text-ink-2">{text}</span></span>
    </Link>
  );
}

function Drafts({ lang }: { lang: Lang }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <details className="mt-10 rounded-2xl border border-line bg-card p-5">
      <summary className="cursor-pointer font-semibold">{t("Dua të përgatis një skicë që tani", "I want to prepare a draft now")}</summary>
      <p className="mt-2 text-sm text-ink-2">{t("Skicat mbeten private. I dërgon për shqyrtim pasi të verifikohet llogaria.", "Drafts stay private. You submit them for review once your account is verified.")}</p>
      <div className="mt-5"><SellWizard canSubmit={false} /></div>
    </details>
  );
}

function Steps({ lang, done = 0 }: { lang: Lang; done?: number }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const steps = [
    [t("Krijo një llogari", "Create an account"), t("Regjistrohu si individ ose biznes.", "Register as an individual or business."), "M4 5.5h16v10H4zM9 19.5h6M12 15.5v4M9.5 11a2 2 0 1 0 0-.1M7 14c.6-1.4 1.6-2 2.5-2s1.9.6 2.5 2M17 3v5M14.5 5.5h5"],
    [t("Verifikohu", "Get verified"), t("Dërgo të dhënat për shqyrtim nga ECONERA.", "Submit your information for ECONERA review."), "M3.5 5.5h17v13h-17zM8.5 11a2 2 0 1 0 0-.1M6 15c.6-1.4 1.6-2 2.5-2s1.9.6 2.5 2M13.5 10h4.5M13.5 13h3"],
    [t("Listo materialet", "List your materials"), t("Dërgoji për miratim dhe arri te blerësit pas publikimit.", "Submit your materials for approval and reach buyers after publication."), "m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9M8 5.3l8 4.5"],
  ];
  return (
    <section aria-labelledby="hapat" className="mt-12 rounded-[1.75rem] border border-line bg-card px-6 py-8 shadow-[0_20px_50px_-36px_rgba(12,47,43,0.5)] md:px-10">
      <h2 id="hapat" className="text-center text-2xl text-[#0c2f2b] md:text-4xl dark:text-ink">{t("Si funksionon? ", "How it works? ")}<span className="text-[#5a9e22]">{t("3 hapa të thjeshtë.", "3 simple steps.")}</span></h2>
      <ol className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start">
        {steps.map(([title, text, d], i) => (
          <li key={title} className="contents">
            <div className="flex items-start gap-4">
              <span className={`grid size-11 shrink-0 place-items-center rounded-full text-lg font-bold ${i < done ? "bg-[#5a9e22] text-white" : "bg-[#e6f6c4] text-[#0c2f2b]"}`}>{i < done ? "✓" : i + 1}</span>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-[#0c2f2b] dark:text-ink"><path d={d} /></svg>
              <span><span className="block text-lg font-semibold text-[#0c2f2b] dark:text-ink">{title}</span><span className="mt-0.5 block text-ink-2">{text}</span></span>
            </div>
            {i < 2 && <span aria-hidden className="hidden pt-2 text-2xl text-ink-2 lg:block">→</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Landing({ lang }: { lang: Lang }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const benefits = [
    [t("Jepu materialeve një jetë të dytë", "Give materials a second life"), "M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19 13 11"],
    [t("Krijo të ardhura shtesë", "Generate extra revenue"), "M4 7c0-1.4 3.6-2.5 8-2.5s8 1.1 8 2.5-3.6 2.5-8 2.5S4 8.4 4 7zM4 7v5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V7M4 12v5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-5"],
    [t("Arri blerësit në Shqipëri dhe Kosovë", "Reach buyers in Albania & Kosovo"), "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M16 11a2.5 2.5 0 1 0 0-5M17.5 14.5c1.6.4 2.6 1.8 3 4"],
    [t("Listime të shqyrtuara nga njerëz", "Human-reviewed listings"), "M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6zM9 12l2.2 2.2L15.5 10"],
  ];
  return (
    <div className="bg-[linear-gradient(180deg,#f7f6f2,#f1f0ea)] dark:bg-none">
      <section className="relative">
        <div className="container-x grid items-center gap-8 pt-10 md:grid-cols-[1fr_1.1fr] md:pt-14">
          <div className="relative z-10">
            <p className="text-sm font-semibold tracking-wide text-[#4c8a1f]">{t("SHIT NË ECONERA", "SELL ON ECONERA")}</p>
            <h1 className="display mt-3 text-[clamp(2.4rem,5vw,4.3rem)] leading-[1.02] text-[#0c2f2b] dark:text-ink">{t("Ktheje tepricën tënde në ", "Turn your surplus into ")}<span className="text-[#5a9e22]">{t("vlerë", "value")}</span>.</h1>
            <p className="mt-4 max-w-md text-lg text-ink-2">{t("Shit materiale ndërtimi të papërdorura, të tepërta ose të rikuperuara te blerës realë.", "Sell unused, surplus or reclaimed construction materials to real buyers.")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/regjistrohu?lloji=furnitor" className="inline-flex h-13 items-center gap-2 rounded-full bg-[#0f4a43] px-7 text-base font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,74,67,.8)] transition hover:bg-[#0c3a35]">{t("Krijo llogari shitësi", "Create seller account")} <span aria-hidden>→</span></Link>
              <Link href="/hyr?lloji=furnitor" className="inline-flex h-13 items-center rounded-full border border-line bg-card px-7 text-base font-semibold text-[#0c2f2b] transition hover:border-[#0f4a43] dark:text-ink">{t("Hyr", "Log in")}</Link>
            </div>
            <ul className="mt-9 grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
              {benefits.map(([label, d]) => (
                <li key={label} className="flex items-center gap-2.5 text-[13px] leading-snug text-[#0c2f2b] dark:text-ink">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5a9e22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d={d} /></svg>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative -mr-5 sm:-mr-8 md:-mt-14"><SellVisual /></div>
        </div>
      </section>
      <div className="container-x pb-16"><Steps lang={lang} /></div>
    </div>
  );
}
