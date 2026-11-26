import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { unsplash } from "@/lib/market/photos";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const title = tr(lang, "Rreth nesh", "About Us");
  const description = tr(lang, "ECONERA lidh materialet qarkulluese, mjetet inteligjente dhe besimin në një platformë për ndërtimin.", "ECONERA connects circular materials, intelligent tools and trust in one platform for construction.");
  return { title, description, openGraph: { title: `${title} | ECONERA`, description }, alternates: { canonical: "/rreth-nesh" } };
}

// Unsplash photographs (free licence), hotlinked as Unsplash requires; local /architecture.jpg is project-owned.
const PHOTO = { hero: "1451976426598-a7593bd6d0b2", clients: "1759435530019-10b2c9f0f315", companies: "1559322575-2f4e66131d55", closing: "1787259295436-7fd01ba4e840" };

const ic = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export default async function AboutPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const green = "text-[#3f7a17] dark:text-lime";
  const label = `text-[11px] font-bold tracking-[0.2em] ${green}`;
  const ink = "text-[#0c2f2b] dark:text-ink";
  const soft = "text-[#3d5c55] dark:text-ink-2";

  const what = [
    [t("Tregu", "Marketplace"), t("Bli dhe shit materiale ndërtimi të ripërdorshme.", "Buy and sell reusable construction materials."), "m12 4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4", null],
    [t("Mjetet AI", "AI Tools"), t("Dizajno, planifiko dhe optimizo me inteligjencë artificiale.", "Design, plan and optimize with artificial intelligence."), "M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.6A3 3 0 0 0 9 18.5h.5V4.5zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.6 3 3 0 0 1-4.5 5.4h-.5V4.5zM9.5 9h-2M14.5 9h2M9.5 14h-2M14.5 14h2", t("Disa mjete janë ende beta", "Some tools are still in beta")],
    ["ECONERA Verify", t("Shitës dhe listime të shqyrtuara nga njerëz.", "Human-reviewed sellers and product listings."), "M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6zM9 12l2.2 2.2L15.5 10", null],
    [t("Ndërtim qarkullues", "Circular Construction"), t("Më pak mbetje. Më shumë vlerë.", "Less waste. More value."), "M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4", null],
  ] as const;
  const why = [
    [t("Ul mbetjet", "Reduce waste"), t("Mbaj në përdorim materialet me vlerë.", "Keep valuable materials in use."), "M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19 13 11"],
    [t("Kurse burime", "Save resources"), t("Materialet bëhen më të lehta për t'u gjetur dhe ripërdorur.", "Make materials easier to find and reuse."), "M4 7c0-1.4 3.6-2.5 8-2.5s8 1.1 8 2.5-3.6 2.5-8 2.5S4 8.4 4 7zM4 7v5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V7M4 12v5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-5"],
    [t("Ndërto më zgjuar", "Build smarter"), t("Teknologji që e bën ndërtimin më efikas.", "Use technology to make construction more efficient."), "M13 2.5 4.5 13.5h7l-1 8 8.5-11h-7z"],
  ];
  const values = [
    [t("Inovacion", "Innovation"), t("Ide të reja për një nesër më të mirë.", "New ideas for a better tomorrow."), "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"],
    [t("Qarkullim", "Circularity"), t("Mbetjet kthehen në vlerë.", "Turning waste into value."), "M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4"],
    [t("Transparencë", "Transparency"), t("Të hapur, të sinqertë dhe përgjegjës.", "Open, honest and accountable."), "M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6zM9 12l2.2 2.2L15.5 10"],
    [t("Aksesueshmëri", "Accessibility"), t("Për individë, biznese dhe komunitete.", "For individuals, businesses and communities."), "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M16 11a2.5 2.5 0 1 0 0-5M17.5 14.5c1.6.4 2.6 1.8 3 4"],
    [t("Besim", "Trust"), t("I ndërtuar me verifikim dhe praktika të përgjegjshme.", "Built through verification and responsible practices."), "M12 20.5s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 3.1c0 5.8-8 10.4-8 10.4zM8.5 12.5l2.3 2 4.7-4.5"],
  ];

  return (
    <div className="bg-[#fbfaf7] dark:bg-bg">
      {/* Hero: bright architecture, centred copy on a soft white wash */}
      <section aria-labelledby="about-title" className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={unsplash(PHOTO.hero, 1920, 900)} alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_48%_70%_at_50%_50%,rgba(251,250,247,0.95)_0%,rgba(251,250,247,0.82)_55%,rgba(251,250,247,0.15)_100%)] max-md:bg-[rgba(251,250,247,0.86)] dark:bg-[radial-gradient(ellipse_48%_70%_at_50%_50%,rgba(3,26,22,0.95),rgba(3,26,22,0.6)_70%,rgba(3,26,22,0.3))]" />
        <div className="container-x relative flex min-h-[62svh] flex-col items-center justify-center py-20 text-center md:min-h-[560px]">
          <p className={label}>{t("HISTORIA JONË", "OUR STORY")}</p>
          <h1 id="about-title" className={`display mt-4 max-w-3xl text-[clamp(2.3rem,5vw,4.3rem)] leading-[1.04] ${ink}`}>{t("Po ndërtojmë një të ardhme më të zgjuar për ndërtimin.", "We are building a smarter future for construction.")}</h1>
          <p className={`mt-5 max-w-xl text-lg ${soft}`}>{t("ECONERA lidh materialet qarkulluese, mjetet inteligjente dhe besimin në një platformë.", "ECONERA connects circular materials, intelligent tools and trust in one platform.")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/treg" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0f4a43] px-6 font-semibold text-white transition hover:bg-[#0c3a35] dark:bg-lime dark:text-bg">{t("Eksploro tregun", "Explore Marketplace")} <span aria-hidden>→</span></Link>
            <Link href="/biznes" className={`inline-flex h-12 items-center rounded-full border border-[#0c2f2b]/30 bg-white/70 px-6 font-semibold backdrop-blur transition hover:border-[#0c2f2b] dark:border-line dark:bg-transparent ${ink}`}>{t("Për kompanitë", "For Companies")}</Link>
          </div>
        </div>
      </section>

      {/* What is ECONERA */}
      <section aria-labelledby="cfare" className="container-x grid gap-10 py-16 md:py-20 lg:grid-cols-[1fr_1.35fr] lg:items-center">
        <div>
          <p className={label}>{t("ÇFARË ËSHTË ECONERA?", "WHAT IS ECONERA?")}</p>
          <h2 id="cfare" className={`display mt-3 text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.08] ${ink}`}>{t("Një platformë ndërtimi qarkullues, e fuqizuar nga teknologjia.", "A circular construction platform, powered by technology.")}</h2>
          <p className={`mt-4 max-w-lg ${soft}`}>{t("ECONERA është një platformë dixhitale që bashkon materialet e ripërdorshme të ndërtimit, mjetet me AI dhe një proces verifikimi të besueshëm, për t'i ndihmuar njerëzit dhe bizneset të ndërtojnë më zgjuar dhe të hedhin më pak.", "ECONERA is a digital platform that brings together reusable construction materials, AI-powered tools and a trusted verification process, helping people and businesses build smarter and reduce waste.")}</p>
        </div>
        <ul className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:divide-x sm:divide-[#0c2f2b]/10 dark:sm:divide-line">
          {what.map(([name, text, d, note]) => (
            <li key={name} className="flex flex-col items-center px-3 text-center">
              <span className={`grid size-14 place-items-center rounded-full bg-[#e6f6c4] text-[#2f5d10] dark:bg-lime/15 dark:text-lime`}><svg {...ic}><path d={d} /></svg></span>
              <p className={`mt-3 font-semibold ${ink}`}>{name}</p>
              <p className={`mt-1 text-sm leading-snug ${soft}`}>{text}</p>
              {note && <p className="mt-1.5 rounded-full bg-[#efeee8] px-2 py-0.5 text-[11px] text-[#5b6b66] dark:bg-bg-2 dark:text-ink-2">{note}</p>}
            </li>
          ))}
        </ul>
      </section>

      {/* Who is ECONERA for */}
      <section aria-labelledby="perkend" className="bg-[#f0f3ee] dark:bg-bg-2">
        <div className="container-x py-16 md:py-20">
          <div className="text-center">
            <p className={label}>{t("PËR KË ËSHTË ECONERA?", "WHO IS ECONERA FOR?")}</p>
            <h2 id="perkend" className={`display mx-auto mt-3 max-w-3xl text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.08] ${ink}`}>{t("E ndërtuar për njerëzit dhe bizneset e gjithë ekosistemit të ndërtimit.", "Built for people and businesses across the construction ecosystem.")}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { href: "/treg", photo: PHOTO.clients, title: t("Për klientët / blerësit", "For Clients / Buyers"), text: t("Gjej materialet e duhura, krahaso opsionet dhe ndërto më zgjuar, me kosto më të ulët dhe ndikim më të vogël në mjedis.", "Find the right materials, compare options and build smarter, at a lower cost and with a smaller environmental impact."), icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" },
              { href: "/biznes", photo: PHOTO.companies, title: t("Për kompanitë", "For Companies"), text: t("Shit materialet e tepërta, menaxho stokun më mirë dhe arri blerës në Shqipëri dhe Kosovë.", "Sell surplus materials, manage stock more efficiently and reach potential buyers in Albania and Kosovo."), icon: "M4 20.5V8l8-4.5L20 8v12.5M9 20.5v-5h6v5M8 10.5h.01M12 10.5h.01M16 10.5h.01" },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="group grid grid-cols-[38%_1fr] overflow-hidden rounded-2xl bg-white shadow-[0_14px_40px_-28px_rgba(12,47,43,0.5)] transition hover:shadow-[0_22px_50px_-26px_rgba(12,47,43,0.55)] max-sm:grid-cols-1 dark:bg-card">
                <div className="relative min-h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={unsplash(c.photo, 640, 480)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="flex items-center gap-4 p-6">
                  <div className="min-w-0 flex-1">
                    <p className={`flex items-center gap-2.5 text-lg font-semibold ${ink}`}><svg {...ic} width={24} height={24} className="shrink-0"><path d={c.icon} /></svg>{c.title}</p>
                    <p className={`mt-2 text-[15px] leading-relaxed ${soft}`}>{c.text}</p>
                  </div>
                  <span aria-hidden className={`text-xl transition group-hover:translate-x-1 ${ink}`}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why ECONERA exists */}
      <section aria-labelledby="pse" className="container-x grid gap-10 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-20">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image src="/architecture.jpg" alt={t("Materiale të rikuperuara: tjegulla, tulla dhe gurë", "Reclaimed materials: roof tiles, bricks and stone")} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
        </div>
        <div>
          <p className={label}>{t("PSE EKZISTON ECONERA", "WHY ECONERA EXISTS")}</p>
          <h2 id="pse" className={`display mt-3 text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.08] ${ink}`}>{t("Materialet e mira meritojnë më shumë se një jetë.", "Good materials deserve more than one life.")}</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-[#0c2f2b]/10 dark:sm:divide-line">
            {why.map(([name, text, d]) => (
              <li key={name} className="sm:px-5 sm:first:pl-0">
                <svg {...ic} className={green}><path d={d} /></svg>
                <p className={`mt-3 font-semibold ${ink}`}>{name}</p>
                <p className={`mt-1 text-sm ${soft}`}>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="vlerat" className="bg-[#f0f3ee] dark:bg-bg-2">
        <div className="container-x grid gap-8 py-14 lg:grid-cols-[0.8fr_2.2fr] lg:items-center">
          <div>
            <p className={label}>{t("VLERAT TONA", "OUR VALUES")}</p>
            <h2 id="vlerat" className={`display mt-3 text-[clamp(1.7rem,2.8vw,2.3rem)] leading-[1.08] ${ink}`}>{t("Parimet që na udhëheqin.", "The principles that guide us.")}</h2>
          </div>
          <ul className="grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-[#0c2f2b]/10 dark:lg:divide-line">
            {values.map(([name, text, d]) => (
              <li key={name} className="flex flex-col items-center px-3 text-center">
                <svg {...ic} width={30} height={30} className={green}><path d={d} /></svg>
                <p className={`mt-3 font-semibold ${ink}`}>{name}</p>
                <p className={`mt-1 text-[13px] leading-snug ${soft}`}>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Trust & transparency */}
      <section aria-labelledby="besimi" className="container-x py-14 md:py-16">
        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr_auto] md:items-center md:gap-10">
          <div>
            <p className={label}>{t("BESIM DHE TRANSPARENCË", "TRUST & TRANSPARENCY")}</p>
            <h2 id="besimi" className={`display mt-3 text-[clamp(1.7rem,2.8vw,2.3rem)] leading-[1.08] ${ink}`}>{t("Një mënyrë më e sigurt dhe më e besueshme për të blerë dhe shitur.", "A safer, more reliable way to buy and sell.")}</h2>
          </div>
          <p className={`md:border-l md:border-[#0c2f2b]/10 md:pl-10 dark:md:border-line ${soft}`}>{t("ECONERA përdor shqyrtim të kontrolluar nga njerëzit për shitësit dhe produktet, dokumentacionin përkatës të materialeve dhe informacion transparent verifikimi, për t'i ndihmuar klientët të blejnë me më shumë informacion. Inspektimi fizik ose certifikimi i pavarur shfaqen vetëm kur janë kryer.", "ECONERA uses human-controlled seller and product review processes, relevant material documentation and transparent verification information to help customers make more informed purchasing decisions. Physical inspection or independent certification is shown only when it has taken place.")}</p>
          <Link href="/verifikimi" className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-[#e6f6c4] px-5 font-semibold text-[#0c2f2b] transition hover:bg-[#d6f0a6] md:self-center dark:bg-lime/15 dark:text-lime">{t("Mëso më shumë", "Learn more")} <span aria-hidden>→</span></Link>
        </div>
      </section>

      {/* Closing banner */}
      <section aria-labelledby="fund" className="theme-dark relative overflow-hidden bg-[#062321] text-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={unsplash(PHOTO.closing, 1920, 700)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_55%_80%_at_50%_50%,rgba(3,26,22,0.88),rgba(3,26,22,0.55))]" />
        <div className="container-x relative py-16 text-center md:py-20">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#c8f169]">{t("LE TË NDËRTOJMË NJË TË ARDHME MË TË MIRË", "LET'S BUILD A BETTER FUTURE")}</p>
          <h2 id="fund" className="display mx-auto mt-3 max-w-2xl text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.06] text-white">{t("Së bashku mund ta bëjmë ndërtimin më qarkullues.", "Together, we can make construction more circular.")}</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary h-12 px-6 text-base">{t("Eksploro ECONERA", "Explore ECONERA")} <span aria-hidden>→</span></Link>
            <Link href="/kontakt?tema=partneritet" className="inline-flex h-12 items-center rounded-full border border-white/60 px-6 font-semibold text-white transition hover:border-[#c8f169] hover:text-[#c8f169]">{t("Bëhu partner", "Become a Partner")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
