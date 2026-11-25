import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Rreth nesh", description: "Misioni, ndikimi dhe ekipi i ECONERA: Sonila Balla dhe Rey Sylaj." };

const impact = [
  ["Mjedisor", "Më pak mbetje", "Materiali ripërdoret, nuk hidhet."],
  ["Ekonomik", "Më lirë", "Furnitori shet stokun, kontraktori kursen."],
  ["Digjital", "Të dhëna", "Një sektor me letër bëhet digjital."],
  ["Social", "Akses", "Firmat e vogla marrin mjete AI."],
];
const sdgs = [["9", "Industri, inovacion dhe infrastrukturë"], ["11", "Qytete dhe komunitete të qëndrueshme"], ["12", "Konsum dhe prodhim i përgjegjshëm"]];
const team = [
  { initials: "SB", name: "Sonila Balla", role: "Themeluese · CEO & CTO", bio: "Ka zhvilluar platformën. Project Manager në projekte ndërkombëtare." },
  { initials: "RS", name: "Rey Sylaj", role: "Bashkëthemelues", bio: "Biznesi, furnitorët, kontraktorët dhe piloti në terren." },
];

export default function RrethNeshPage() {
  return (
    <>
      <PageHero eyebrow="Misioni" title={<>Fiton mjedisi,<br />fiton biznesi.</>} lead="ECONERA lidh materialet e tepërta të ndërtimit me projektet që kanë nevojë për to: stok, oferta, transport dhe dokumente në një vend." />

      <section className="container-x py-16 md:py-20">
        <p className="eyebrow">Pse në Shqipëri</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2 className="display text-4xl md:text-5xl">Ndërtimi peshon 2.5 herë më shumë se në Europë.</h2>
          <p className="text-ink-2">Ndërtimi është 12.6% e PBB-së në Shqipëri, kundrejt 5.0% mesatares së BE-së (Albanian Daily News, sipas të dhënave zyrtare), dhe u rrit me 7.4% në 2025 (INSTAT).</p>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {impact.map(([k, t, d]) => (
            <article key={k} className="card p-6"><p className="eyebrow text-ink-2">{k}</p><h3 className="mt-3 text-xl font-semibold">{t}</h3><p className="mt-2 text-sm text-ink-2">{d}</p></article>
          ))}
        </div>
      </section>

      <section className="theme-dark border-y border-line">
        <div className="container-x py-16 md:py-20">
          <p className="eyebrow">Objektivat e OKB-së</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {sdgs.map(([n, t]) => (
              <div key={n} className="border-t-2 border-lime pt-5"><p className="display text-6xl text-lime">{n}</p><p className="mt-2 font-medium">{t}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16 md:py-20">
        <p className="eyebrow">Ekipi</p>
        <h2 className="display mt-4 text-4xl md:text-5xl">Platforma është ndërtuar nga vetë ekipi.</h2>
        <p className="lead mt-4 max-w-2xl">Themeluesit nuk marrin pagë nga granti. Çdo lek shkon te produkti dhe piloti.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {team.map((p) => (
            <article key={p.name} className="card flex gap-6 p-6 md:p-8">
              <div className="grid size-24 shrink-0 place-items-center rounded-2xl border border-line bg-bg-2 font-mono text-2xl text-lime" aria-hidden="true">{p.initials}</div>
              <div><h3 className="text-xl font-semibold">{p.name}</h3><p className="mt-1 text-sm text-lime">{p.role}</p><p className="mt-3 text-ink-2">{p.bio}</p></div>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3"><Link href="/kontakt" className="btn-primary">Bashkohu me pilotin</Link><Link href="/treg" className="btn-ghost">Shiko tregun</Link></div>
      </section>
    </>
  );
}
