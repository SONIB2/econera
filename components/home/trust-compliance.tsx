import Link from "next/link";
import { BookIcon, PinIcon, VerifyIcon } from "@/components/site/tool-icons";
import { tr, type Lang } from "@/lib/lang";

/** Line icons for the five pillars (24px grid, 1.6 stroke, same family as the tool icons). */
const base = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const SellerIcon = () => <svg {...base}><circle cx="10" cy="8" r="3.2" /><path d="M4 19.5c.6-3.4 3-5.3 6-5.3 1.2 0 2.3.3 3.2.8" /><path d="m15 18 1.8 1.8 3.7-3.8" /></svg>;
const ReviewIcon = () => <svg {...base}><rect x="4.5" y="3.5" width="15" height="17" rx="2" /><path d="M8 8h8M8 11.5h5" /><path d="m9 16 1.8 1.8L15 13.8" /></svg>;
const TraceIcon = () => <svg {...base}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h3a3 3 0 0 1 3 3v0a3 3 0 0 0 2 2.8M8 18h3a3 3 0 0 0 3-3v0a3 3 0 0 1 2-2.8" /></svg>;
const ProtectIcon = () => <svg {...base}><path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z" /><path d="M9.5 11.5h5M12 9v5" /></svg>;
const DocIcon = () => <BookIcon className="size-[26px]" />;

/** A decorative, non-scannable QR-style mark for the example passport. */
function SampleCode() {
  const n = 21, cells: string[] = [];
  let x = 11;
  const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const finder = (r: number, c: number) => [[0, 0], [0, 14], [14, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!finder(r, c) && rnd() > 0.52) cells.push(`M${c} ${r}h1v1h-1z`);
  const eye = (cx: number, cy: number) => <g key={`${cx}-${cy}`}><rect x={cx + 0.5} y={cy + 0.5} width="6" height="6" fill="none" stroke="currentColor" /><rect x={cx + 2} y={cy + 2} width="3" height="3" fill="currentColor" /></g>;
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="size-[88px] text-[#0c2f2b] dark:text-ink" shapeRendering="crispEdges" aria-hidden>
      <path d={cells.join("")} fill="currentColor" />{eye(0, 0)}{eye(14, 0)}{eye(0, 14)}
    </svg>
  );
}

/**
 * ECONERA Trust & Compliance: five pillars that describe processes ECONERA actually runs, ISO standards shown
 * strictly as planned objectives, and an illustrative material passport. `business` adds the industry block.
 */
export function TrustCompliance({ lang, business = true }: { lang: Lang; business?: boolean }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const ink = "text-[#0c2f2b] dark:text-ink";
  const pillars = [
    { Icon: SellerIcon, title: t("Verifikimi i shitësit", "Seller Verification"), text: t("Identiteti dhe regjistrimi i biznesit shqyrtohen nga stafi i autorizuar i ECONERA.", "Identity and business registration reviewed by authorized ECONERA staff.") },
    { Icon: ReviewIcon, title: t("Listime të shqyrtuara nga njerëz", "Human-Reviewed Listings"), text: t("Çdo listim shqyrtohet para publikimit.", "Every listing is reviewed before publication.") },
    { Icon: DocIcon, title: t("Dokumentacion teknik", "Technical Documentation"), text: t("Fletë teknike, dokumente CE dhe deklarata të performancës, kur ekzistojnë.", "Technical datasheets, CE documentation and declarations of performance, where applicable.") },
    { Icon: TraceIcon, title: t("Gjurmueshmëria e materialit", "Material Traceability"), text: t("Regjistër dixhital me origjinën, dokumentet dhe historikun e verifikimit.", "Digital records of origin, available documentation and verification history.") },
    { Icon: ProtectIcon, title: t("Mbrojtja e klientit", "Customer Protection"), text: t("Raportim transparent, mbështetje dhe ankesa të shqyrtuara nga njerëz.", "Transparent reporting, customer support and human-reviewed complaints.") },
  ];
  const standards = [
    ["ISO 9001", t("Menaxhimi i cilësisë", "Quality management")],
    ["ISO 14001", t("Menaxhimi mjedisor", "Environmental management")],
    ["ISO/IEC 27001", t("Siguria e informacionit", "Information security")],
  ];
  const passport: [string, React.ReactNode][] = [
    [t("Materiali", "Material"), t("Parket lisi i rikuperuar, 40 m²", "Reclaimed oak flooring, 40 m²")],
    [t("Shitësi", "Seller"), <span key="s" className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#3f8f2f] dark:bg-lime" />{t("Biznes i verifikuar", "Verified business")}</span>],
    [t("Listimi", "Listing review"), t("Miratuar nga stafi i ECONERA", "Approved by ECONERA staff")],
    [t("Origjina", "Origin"), t("Rinovim banese, Tiranë", "Apartment renovation, Tirana")],
    [t("Dokumentet", "Documents"), t("Fletë teknike (PDF)", "Technical datasheet (PDF)")],
    [t("Inspektimi fizik", "Physical inspection"), t("Nuk është kryer", "Not performed")],
    [t("Verifikuar më", "Verified on"), "12.11.2026"],
  ];

  return (
    <section aria-labelledby="besimi" className="bg-[#f5f7f4] text-ink dark:bg-bg">
      <div className="container-x py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[#3f8f2f] dark:text-lime">{t("ECONERA BESIMI DHE PËRPUTHSHMËRIA", "ECONERA TRUST & COMPLIANCE")}</p>
          <h2 id="besimi" className={`display mt-3 text-[clamp(2rem,3.8vw,3rem)] leading-[1.06] ${ink}`}>{t("Ndërtuar mbi besim. Projektuar për transparencë.", "Built on trust. Designed for transparency.")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-2">{t("Një qasje e përgjegjshme ndaj ndërtimit qarkullues, me shqyrtim njerëzor, dokumentacion transparent dhe gjurmueshmëri të materialeve.", "A responsible approach to circular construction, supported by human review, transparent documentation and material traceability.")}</p>
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-line">
          {pillars.map(({ Icon, title, text }) => (
            <li key={title} className="text-center lg:px-5">
              <span className="mx-auto grid size-12 place-items-center text-[#3f8f2f] dark:text-lime"><Icon /></span>
              <p className={`mt-3 font-semibold ${ink}`}>{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="border-t border-line pt-6">
            <h3 className={`text-xl font-semibold ${ink}`}>{t("Standarde ndërkombëtare dhe praktika të përgjegjshme", "International standards & responsible practices")}</h3>
            <p className="mt-2 text-sm text-ink-2">{t("Këto standarde janë objektiva për të ardhmen. ECONERA nuk është ende e certifikuar në asnjërin.", "These standards are future objectives. ECONERA is not yet certified to any of them.")}</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {standards.map(([code, name]) => (
                <li key={code} className="flex items-center gap-4 py-3">
                  <span className={`w-32 shrink-0 whitespace-nowrap font-semibold tabular-nums ${ink}`}>{code}</span>
                  <span className="min-w-0 flex-1 text-sm text-ink-2">{name}</span>
                  <span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-2">{t("Objektiv i planifikuar", "Planned objective")}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className={`font-semibold ${ink}`}>{t("Procese në zbatim", "Implemented processes")}</dt><dd className="mt-1 text-ink-2">{t("Verifikimi i shitësve, shqyrtimi i listimeve, shqyrtimi i ankesave.", "Seller verification, listing review, complaint review.")}</dd></div>
              <div><dt className={`font-semibold ${ink}`}>{t("Në plan", "Planned")}</dt><dd className="mt-1 text-ink-2">ISO 9001, ISO 14001, ISO/IEC 27001.</dd></div>
              <div><dt className={`font-semibold ${ink}`}>{t("Certifikim i pavarur", "Independently certified")}</dt><dd className="mt-1 text-ink-2">{t("Asnjë ende.", "None yet.")}</dd></div>
            </dl>
          </div>

          <figure className="rounded-2xl border border-line bg-card p-5 shadow-[0_18px_40px_-30px_rgba(6,34,30,0.45)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[#3f8f2f] dark:text-lime"><VerifyIcon className="size-5" />{t("Pasaporta dixhitale e materialit", "Digital Material Passport")}</p>
                <p className={`mt-1 font-mono text-xs ${ink}`}>ECN-EX-2026-0001</p>
              </div>
              <span className="rounded-full bg-[#eef3e6] px-2.5 py-0.5 text-[11px] font-semibold text-[#0c2f2b] dark:bg-lime/15 dark:text-lime">{t("Shembull ilustrues", "Illustrative example")}</span>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto]">
              <dl className="grid gap-2 text-sm">
                {passport.map(([k, v]) => <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-2 border-b border-line/70 pb-2 last:border-0"><dt className="text-ink-2">{k}</dt><dd className={ink}>{v}</dd></div>)}
              </dl>
              <div className="flex flex-col items-center gap-1.5 self-start rounded-xl border border-line p-3">
                <SampleCode />
                <span className="text-[10px] text-ink-2">{t("Kod shembull", "Sample code")}</span>
              </div>
            </div>
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-1.5 text-xs text-ink-2"><PinIcon className="size-4" />{t("Të dhënat e shembullit nuk i përkasin një materiali real.", "Example data, not a real material.")}</span>
              <Link href="/verify" className="btn-primary">{t("Njihu me ECONERA Verify", "Explore ECONERA Verify")} <span aria-hidden>→</span></Link>
            </figcaption>
          </figure>
        </div>
      </div>

      {business && (
        <div className="border-t border-line bg-card">
          <div className="container-x flex flex-col items-start gap-6 py-12 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className={`display text-[clamp(1.6rem,2.8vw,2.2rem)] leading-tight ${ink}`}>{t("Lidhje të besueshme në gjithë industrinë e ndërtimit.", "Trusted connections across the construction industry.")}</h2>
              <p className="mt-2 text-ink-2">{t("Kompani ndërtimi, furnitorë materialesh, prodhues, arkitektë dhe kontraktorë.", "Construction companies, material suppliers, manufacturers, architects and contractors.")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/biznes" className="btn-primary">{t("Zgjidhjet për bizneset", "Explore Business Solutions")}</Link>
              <Link href="/partneret" className="btn-ghost">{t("Partnerët", "Our Partners")}</Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
