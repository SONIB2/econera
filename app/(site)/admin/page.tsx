import Link from "next/link";
import { runExpiry } from "@/app/(site)/admin/actions";
import { Pill } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { RISK, ROLES } from "@/lib/verify/labels";
import { hasRole, requireStaff } from "@/lib/verify/staff";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ r?: string; n?: string }> }) {
  const s = await requireStaff();
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const p = await searchParams;
  const c = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const head = (table: string) => s.db.from(table).select("*", { count: "exact", head: true });
  const soon = in30Days();
  const [pending, review, info, inspection, escalated, published, rejected, suspended, sellers, verifiedBiz, disputes, expiring, quotes] = await Promise.all([
    c(head("materials").eq("moderation", "pending")), c(head("materials").eq("moderation", "under_review")), c(head("materials").eq("moderation", "info_required")),
    c(head("materials").eq("moderation", "inspection_required")), c(head("materials").eq("moderation", "escalated")), c(head("materials").eq("publication", "published")),
    c(head("materials").eq("moderation", "rejected")), c(head("materials").eq("publication", "suspended")),
    c(head("seller_verifications").in("status", ["submitted", "under_review"])), c(head("seller_verifications").eq("status", "approved").eq("kind", "business")),
    c(head("disputes").in("status", ["open", "assigned", "investigating", "waiting_customer"])), c(head("verification_documents").lte("expires_on", soon).eq("review_status", "accepted")),
    c(head("quotation_requests")),
  ]);
  const { data: queue } = await s.db.from("materials").select("id,title,category,risk_level,moderation,submitted_at,assigned_to,seller_label").in("moderation", ["pending", "under_review", "escalated", "inspection_required"]).order("submitted_at", { ascending: true, nullsFirst: false }).limit(8);
  const tiles: [string, number, string, string][] = [
    [t("Në pritje të miratimit", "Pending approvals"), pending, "/admin/listimet?status=pending", ""],
    [t("Në shqyrtim", "Under review"), review, "/admin/listimet?status=under_review", ""],
    [t("Kërkohen të dhëna", "Information required"), info, "/admin/listimet?status=info_required", ""],
    [t("Inspektim teknik", "Technical inspection"), inspection, "/admin/listimet?status=inspection_required", ""],
    [t("Te specialisti", "Escalated"), escalated, "/admin/listimet?status=escalated", ""],
    [t("Të publikuara", "Published"), published, "/admin/listimet?status=published", ""],
    [t("Të refuzuara", "Rejected"), rejected, "/admin/listimet?status=rejected", ""],
    [t("Të pezulluara", "Suspended"), suspended, "/admin/listimet?status=suspended", ""],
    [t("Shitës në pritje", "Seller cases"), sellers, "/admin/shitesit", ""],
    [t("Biznese të verifikuara", "Verified businesses"), verifiedBiz, "/admin/shitesit?status=approved", ""],
    [t("Ankesa të hapura", "Open complaints"), disputes, "/admin/ankesat", ""],
    [t("Certifikata që skadojnë (30 ditë)", "Certificates expiring (30 days)"), expiring, "/admin/listimet?status=published", ""],
    [t("Kërkesa për ofertë (porosi)", "Quote requests (orders)"), quotes, "/admin", ""],
  ];
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl md:text-5xl">{t("Qendra e verifikimit", "Verification centre")}</h1>
          <p className="mt-2 text-sm text-ink-2">{s.user.email} · {s.roles.map((r) => ROLES[r]?.[lang]).join(", ")} · MFA ✓</p>
        </div>
        {hasRole(s.roles, ["product_officer", "technical_reviewer"]) && <form action={runExpiry}><button className="btn-ghost">{t("Kontrollo skadimet tani", "Check expiries now")}</button></form>}
      </header>
      {p.r === "expired" && <p role="status" className="rounded-xl border border-line bg-accent/50 px-4 py-3 text-sm">{t(`${p.n} listime dolën nga tregu për shkak të dokumenteve të skaduara.`, `${p.n} listings left the market because of expired documents.`)}</p>}
      {p.r === "forbidden" && <p role="alert" className="rounded-xl border border-[#e8b7a8] bg-[#fdf0ec] px-4 py-3 text-sm">{t("Roli yt nuk e lejon atë faqe.", "Your role does not allow that page.")}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map(([label, n, href]) => <Link key={label} href={href} className="card p-4 transition hover:border-lime/60"><span className="text-xs text-ink-2">{label}</span><span className="display mt-2 block text-4xl tabular-nums">{n}</span></Link>)}
      </div>
      <section className="card p-5 md:p-7" aria-labelledby="radha">
        <h2 id="radha" className="text-2xl">{t("Radha e shqyrtimit", "Review queue")}</h2>
        {!queue?.length && <p className="mt-3 text-sm text-ink-2">{t("Asnjë listim në pritje.", "No listings waiting.")}</p>}
        <ul className="mt-4 grid gap-2">
          {queue?.map((m) => (
            <li key={m.id}><Link href={`/admin/listimet/${m.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 hover:border-lime/60">
              <span className="min-w-0"><span className="font-medium">{m.title}</span><span className="block text-xs text-ink-2">{m.seller_label ?? t("Shitës", "Seller")} · {m.submitted_at ? new Date(m.submitted_at).toLocaleString("en-GB") : ""}</span></span>
              <span className="flex gap-2">{m.risk_level && <Pill tone={RISK[m.risk_level]?.tone}>{RISK[m.risk_level]?.[lang]}</Pill>}{m.assigned_to && <Pill>{m.assigned_to === s.user.id ? t("tek ti", "yours") : t("i caktuar", "assigned")}</Pill>}</span>
            </Link></li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-ink-2">{t("Pagesat, rimbursimet dhe financat kërkojnë një ofrues pagesash të autorizuar; derisa të lidhet, \"porositë\" janë kërkesa për ofertë.", "Payments, refunds and finance need an authorised payment provider; until then \"orders\" are quote requests.")}</p>
    </div>
  );
}

function in30Days() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}
