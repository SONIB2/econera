import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FOUNDERS } from "@/lib/founders";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const title = tr(lang, "Rreth ECONERA", "About ECONERA");
  const description = tr(lang, "Historia, misioni dhe vizioni i ECONERA: inteligjencë për ndërtimin qarkullues, e lindur në Shqipëri dhe e ndërtuar për botën.", "The story, mission and vision of ECONERA: construction intelligence for circular building, born in Albania and built for the world.");
  return { title, description, openGraph: { title, description, images: ["/home-pavilion.webp"] }, alternates: { canonical: "/rreth-nesh" } };
}

const I = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export default async function AboutPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);

  const products = [
    { name: "Marketplace", href: "/treg", live: true, text: t("Materiale të tepërta, të rikuperuara dhe copa nga shitës të shqyrtuar.", "Surplus, reclaimed and offcut materials from reviewed sellers.") },
    { name: "ECONERA Verify", href: "/verifikimi", live: true, text: t("Shqyrtim njerëzor i shitësve dhe i çdo listimi para publikimit.", "Human review of sellers and of every listing before it goes live.") },
    { name: "Smart Basket", href: "/ai/shporta", live: true, text: t("Nga lista e projektit te kombinimi më i mirë i shitësve brenda buxhetit.", "From a project list to the best combination of sellers within budget.") },
    { name: "SmartCut", href: "/ai/smartcut", live: true, text: t("Plane prerjeje që përdorin copat ekzistuese para se të blesh të reja.", "Cutting plans that use existing offcuts before buying new sheets.") },
    { name: "AI Renovation", href: "/ai/renovim", live: false, text: t("Vizualizo hapësirën me materiale që ekzistojnë realisht në treg.", "Visualise a space with materials that really exist on the marketplace.") },
    { name: "ECONERA Voice", href: "/ai", live: false, text: t("Kërko dhe menaxho materialet me zë, në shqip ose anglisht.", "Search and manage materials by voice, in Albanian or English.") },
  ];
  const values = [
    [t("Inovacion", "Innovation"), t("Teknologji që e bën ndërtimin më të zgjuar, jo më të ndërlikuar.", "Technology that makes building smarter, not more complicated."), "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"],
    [t("Qarkullim", "Circularity"), t("Çdo material e meriton një jetë të dytë.", "Every material deserves a second life."), "M7 18H4.5l3-5.2M17 6h2.5l-3 5.2M12 3.5l2.6 4.5M9.4 8 12 3.5M20 16l-2.6 4.5h-5M4 16l2.6 4.5"],
    [t("Transparencë", "Transparency"), t("Tregojmë çfarë u kontrollua, nga kush dhe kur.", "We show what was checked, by whom and when."), "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
    [t("Aksesueshmëri", "Accessibility"), t("E thjeshtë për këdo, nga kantieri te zyra, edhe me zë.", "Simple for everyone, from the site to the office, even by voice."), "M12 6.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM5 9l7 1.5L19 9M12 10.5V15l-3 6M12 15l3 6"],
    [t("Besim", "Trust"), t("Njerëzit vendosin çfarë publikohet; AI vetëm ndihmon.", "People decide what is published; AI only assists."), "M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6zM9 12l2.2 2.2L15.5 10"],
  ];
  const partners = [t("Kompani ndërtimi", "Construction companies"), t("Furnitorë", "Suppliers"), t("Arkitektë", "Architects"), t("Prodhues", "Manufacturers"), t("Investitorë", "Investors"), t("Organizata të qëndrueshmërisë", "Sustainability organisations")];
  const label = "text-[11px] font-semibold tracking-[0.3em]";

  return (
    <div className="bg-[#f6f5f1] text-[#0c2f2b] dark:bg-bg dark:text-ink">
      {/* Hero */}
      <section aria-labelledby="about-title" className="theme-dark relative -mt-[76px] flex min-h-[88svh] items-end overflow-hidden bg-[#062321] pt-[76px] text-ink">
        <Image src="/home-pavilion.webp" alt="" fill priority sizes="100vw" className="object-cover object-[60%_50%]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,22,19,0.92)_0%,rgba(3,22,19,0.55)_50%,rgba(3,22,19,0.15)_100%),linear-gradient(0deg,rgba(3,22,19,0.9),transparent_45%)]" />
        <div className="container-x relative pb-16 md:pb-24">
          <p className={`${label} text-[#c8f169]`}>{t("HISTORIA JONË. QËLLIMI YNË.", "OUR STORY. OUR PURPOSE.")}</p>
          <h1 id="about-title" className="display mt-5 max-w-5xl text-[clamp(2.3rem,5.4vw,5rem)] leading-[1.02] text-white">
            {t("Nuk po ndryshojmë vetëm si ndërtojmë.", "We're not just changing how we build.")}<br />
            <span className="text-[#c8f169]">{t("Po ndryshojmë atë që lëmë pas.", "We're changing what we leave behind.")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">{t("Një brez i ri i inteligjencës së ndërtimit, i lindur në Shqipëri dhe i ndërtuar për botën.", "A new generation of construction intelligence, born in Albania and built for the world.")}</p>
        </div>
      </section>

      {/* The challenge */}
      <section aria-labelledby="sfida" className="container-x grid gap-10 py-20 md:grid-cols-[1fr_1fr] md:items-center md:py-28">
        <div>
          <p className={`${label} text-[#4c8a1f]`}>{t("SFIDA", "THE CHALLENGE")}</p>
          <h2 id="sfida" className="display mt-4 text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.02]">{t("Shumë të vlefshme për t'u hedhur.", "Too valuable to waste.")}</h2>
          <div className="mt-6 max-w-lg space-y-4 text-lg leading-relaxed text-[#335a52] dark:text-ink-2">
            <p>{t("Pas çdo kantieri mbeten paleta tullash, pllaka, dru dhe panele që askush nuk i përdor. Stoqet e tepërta zënë vend në depo, ndërsa një projekt tjetër, ndoshta në të njëjtin qytet, i blen ato të reja.", "After every project, pallets of bricks, tiles, timber and panels are left unused. Surplus stock fills warehouses while another project, perhaps in the same city, buys the same materials new.")}</p>
            <p>{t("Problemi nuk është mungesa e materialeve, por mungesa e lidhjes: kush ka çfarë, ku, në çfarë gjendje dhe me çfarë dokumentesh. Pa këtë, materialet e mira përfundojnë si mbetje.", "The problem isn't a lack of materials but a lack of connection: who has what, where, in what condition and with which documents. Without it, good materials end up as waste.")}</p>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
          <Image src="/architecture.jpg" alt={t("Materiale ndërtimi të rikuperuara: tjegulla, tulla dhe gurë", "Reclaimed building materials: roof tiles, bricks and stone")} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>

      {/* Our solution */}
      <section aria-labelledby="zgjidhja" className="border-y border-[#0c2f2b]/10 bg-white dark:border-line dark:bg-card">
        <div className="container-x py-20 md:py-28">
          <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-end">
            <div>
              <p className={`${label} text-[#4c8a1f]`}>{t("ZGJIDHJA JONË", "OUR SOLUTION")}</p>
              <h2 id="zgjidhja" className="display mt-4 text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.02]">{t("Një platformë. Një mënyrë e re për të ndërtuar.", "One platform. A new way to build.")}</h2>
            </div>
            <p className="text-lg leading-relaxed text-[#335a52] dark:text-ink-2">{t("ECONERA lidh ripërdorimin e materialeve, dizajnin, blerjen, optimizimin dhe besimin në një sistem të vetëm. Të dhënat kalojnë nga një mjet te tjetri, pa i shkruar dy herë.", "ECONERA connects material reuse, design, procurement, optimisation and trust in one system. Data moves from one tool to the next, without typing it twice.")}</p>
          </div>
          <ul className="mt-12 divide-y divide-[#0c2f2b]/10 border-y border-[#0c2f2b]/10 dark:divide-line dark:border-line">
            {products.map((p) => (
              <li key={p.name}>
                <Link href={p.href} className="group grid gap-1 py-5 sm:grid-cols-[14rem_1fr_auto] sm:items-center sm:gap-6">
                  <span className="text-xl font-semibold">{p.name}</span>
                  <span className="text-[#335a52] dark:text-ink-2">{p.text}</span>
                  <span className={`w-max rounded-full px-3 py-1 text-xs font-semibold ${p.live ? "bg-[#e6f6c4] text-[#2f5d10]" : "bg-[#efeee8] text-[#5b6b66] dark:bg-bg-2 dark:text-ink-2"}`}>{p.live ? t("Në dispozicion", "Available") : t("Në zhvillim · beta", "In development · beta")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mission & vision */}
      <section aria-label={t("Misioni dhe vizioni", "Mission and vision")} className="theme-dark bg-[#062321] text-ink">
        <div className="container-x grid md:grid-cols-2">
          <div className="border-b border-white/10 py-20 md:border-r md:border-b-0 md:py-28 md:pr-14">
            <p className={`${label} text-[#c8f169]`}>{t("MISIONI YNË", "OUR MISSION")}</p>
            <h2 className="display mt-5 text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.05] text-white">{t("Që çdo material të ketë rëndësi.", "Make every material matter.")}</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">{t("Ta bëjmë ndërtimin më inteligjent, më të aksesueshëm dhe më efikas në burime, duke lidhur njerëzit, bizneset, materialet e ripërdorshme dhe teknologjinë.", "To make construction more intelligent, accessible and resource-efficient by connecting people, businesses, reusable materials and technology.")}</p>
          </div>
          <div className="py-20 md:py-28 md:pl-14">
            <p className={`${label} text-[#c8f169]`}>{t("VIZIONI YNË", "OUR VISION")}</p>
            <h2 className="display mt-5 text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.05] text-white">{t("Një botë ku mbetjet bëhen mundësi.", "A world where waste becomes opportunity.")}</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">{t("Të bëhemi një platformë teknologjike e njohur ndërkombëtarisht për ndërtimin qarkullues, që ndihmon individët dhe bizneset të ndërtojnë më zgjuar, të ulin mbetjet dhe të zbulojnë vlerën e materialeve ekzistuese.", "To become an internationally recognised circular construction technology platform, helping individuals and businesses build smarter, reduce waste and unlock the value of existing materials.")}</p>
          </div>
        </div>
      </section>

      {/* Global ambition */}
      <section aria-labelledby="bota" className="container-x grid gap-12 py-20 md:grid-cols-[1fr_1fr] md:items-center md:py-28">
        <div className="order-2 md:order-1"><Globe lang={lang} /></div>
        <div className="order-1 md:order-2">
          <p className={`${label} text-[#4c8a1f]`}>{t("AMBICIA GLOBALE", "GLOBAL AMBITION")}</p>
          <h2 id="bota" className="display mt-4 text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.02]">{t("Lindur në Shqipëri. Ndërtuar për botën.", "Born in Albania. Built for the world.")}</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#335a52] dark:text-ink-2">{t("Fillojmë nga Shqipëria dhe tregu rajonal, me shitës në Shqipëri dhe Kosovë. Platforma është ndërtuar që në fillim për shumë gjuhë, monedha, njësi matëse dhe rregulla vendi, që të rritet ndërkombëtarisht hap pas hapi.", "We are starting in Albania and the regional market, with sellers in Albania and Kosovo. The platform is built from day one for multiple languages, currencies, units and country rules, so it can grow internationally step by step.")}</p>
          <p className="mt-4 text-sm text-[#5b6b66] dark:text-ink-2">{t("Sot: Shqipëri dhe Kosovë. Tregjet e tjera vijnë kur të kemi shitës vendas.", "Today: Albania and Kosovo. Other markets follow once local sellers join.")}</p>
        </div>
      </section>

      {/* Founders */}
      <section aria-labelledby="themeluesit" className="border-t border-[#0c2f2b]/10 bg-white dark:border-line dark:bg-card">
        <div className="container-x py-20 md:py-28">
          <p className={`${label} text-[#4c8a1f]`}>{t("THEMELUESIT", "MEET THE FOUNDERS")}</p>
          <h2 id="themeluesit" className="display mt-4 max-w-3xl text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.02]">{t("Ndërtuar nga njerëz që e njohin problemin.", "Built by people who know the problem.")}</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {FOUNDERS.map((f) => (
              <article key={f.name} className="grid grid-cols-[7rem_1fr] gap-6 sm:grid-cols-[9rem_1fr]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#062321]">
                  {f.photo
                    ? <Image src={f.photo} alt={f.name} fill sizes="144px" className="object-cover" />
                    : <span aria-hidden className="display absolute inset-0 grid place-items-center text-4xl text-[#c8f169]">{f.initials}</span>}
                </div>
                <div className="self-center">
                  <h3 className="text-2xl font-semibold">{f.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#4c8a1f]">{f.role[lang]}</p>
                  <p className="mt-3 text-[#335a52] dark:text-ink-2">{f.bio[lang]}</p>
                  {f.linkedin && <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold underline-offset-4 hover:underline">LinkedIn ↗</a>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="vlerat" className="container-x py-20 md:py-28">
        <p className={`${label} text-[#4c8a1f]`}>{t("VLERAT TONA", "OUR VALUES")}</p>
        <h2 id="vlerat" className="sr-only">{t("Vlerat tona", "Our values")}</h2>
        <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {values.map(([name, text, d]) => (
            <li key={name} className="border-t-2 border-[#0c2f2b] pt-5 dark:border-ink">
              <svg {...I} className="text-[#4c8a1f]"><path d={d} /></svg>
              <p className="mt-4 text-xl font-semibold">{name}</p>
              <p className="mt-2 text-[#335a52] dark:text-ink-2">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Trust */}
      <section aria-labelledby="besimi" className="container-x pb-20 md:pb-28">
        <div className="grid gap-8 rounded-[2rem] bg-[#e9efe8] p-8 md:grid-cols-[1fr_1.3fr] md:p-14 dark:bg-bg-2">
          <div>
            <p className={`${label} text-[#4c8a1f]`}>ECONERA VERIFY</p>
            <h2 id="besimi" className="display mt-4 text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.05]">{t("Besim që mund ta kontrollosh.", "Trust you can check.")}</h2>
          </div>
          <div className="space-y-4 text-lg leading-relaxed text-[#335a52] dark:text-ink-2">
            <p>{t("Çdo shitës dhe çdo listim shqyrtohet nga një person i ECONERA-s para publikimit. AI ndihmon të gjejë mangësi, por nuk miraton asgjë vetë.", "Every seller and every listing is reviewed by a person at ECONERA before going live. AI helps spot gaps, but never approves anything on its own.")}</p>
            <p>{t("Dokumentet teknike dhe pasaportat e materialit tregojnë qartë çfarë u kontrollua. Inspektimi fizik ose certifikimi i pavarur shfaqen vetëm kur janë kryer realisht.", "Technical documents and material passports show clearly what was checked. Physical inspection or independent certification is shown only when it has actually taken place.")}</p>
            <Link href="/verifikimi" className="inline-flex font-semibold text-[#0c2f2b] underline-offset-4 hover:underline dark:text-ink">{t("Si funksionon verifikimi →", "How verification works →")}</Link>
          </div>
        </div>
      </section>

      {/* Partnerships */}
      <section aria-labelledby="partneret" className="border-t border-[#0c2f2b]/10 dark:border-line">
        <div className="container-x grid gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:items-end md:py-28">
          <div>
            <p className={`${label} text-[#4c8a1f]`}>{t("PARTNERITETE", "PARTNERSHIPS")}</p>
            <h2 id="partneret" className="display mt-4 text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.02]">{t("E ardhmja ndërtohet së bashku.", "The future is built together.")}</h2>
            <p className="mt-5 max-w-lg text-lg text-[#335a52] dark:text-ink-2">{t("Ftojmë këdo që do të ndërtojë më zgjuar dhe të hedhë më pak të bashkëpunojë me ECONERA.", "We invite everyone who wants to build smarter and waste less to work with ECONERA.")}</p>
            <ul className="mt-6 flex flex-wrap gap-2">{partners.map((p) => <li key={p} className="rounded-full border border-[#0c2f2b]/15 px-3.5 py-1.5 text-sm dark:border-line">{p}</li>)}</ul>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/kontakt?tema=partneritet" className="inline-flex h-13 items-center gap-2 rounded-full bg-[#0f4a43] px-7 font-semibold text-white transition hover:bg-[#0c3a35]">{t("Bëhu partner", "Become a Partner")} <span aria-hidden>→</span></Link>
            <Link href="/kontakt" className="inline-flex h-13 items-center rounded-full border border-[#0c2f2b]/25 px-7 font-semibold transition hover:border-[#0c2f2b] dark:border-line">{t("Na kontaktoni", "Contact Us")}</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section aria-labelledby="fund" className="theme-dark relative overflow-hidden bg-[#062321] text-ink">
        <Image src="/story-rebuild.webp" alt="" fill sizes="100vw" className="object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,#062321,rgba(6,35,33,0.4))]" />
        <div className="container-x relative py-24 text-center md:py-32">
          <h2 id="fund" className="display mx-auto max-w-3xl text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] text-white">{t("Le të ndërtojmë një të ardhme më të mirë.", "Let's build a better future.")}</h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary h-13 px-7 text-base">{t("Eksploro ECONERA", "Explore ECONERA")}</Link>
            <Link href="/kontakt?tema=partneritet" className="inline-flex h-13 items-center rounded-full border border-white/40 px-7 font-semibold text-white transition hover:border-[#c8f169] hover:text-[#c8f169]">{t("Bëhu partner", "Become a Partner")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Abstract globe: meridians and parallels, Albania highlighted, faint arcs towards markets that are not open yet. */
function Globe({ lang }: { lang: "sq" | "en" }) {
  const al = { x: 238, y: 168 };
  const future = [[120, 150], [170, 250], [330, 120], [350, 230], [270, 300]];
  return (
    <figure className="mx-auto w-full max-w-[480px]">
      <svg viewBox="0 0 480 440" role="img" aria-label={lang === "en" ? "Globe with Albania highlighted as ECONERA's starting market" : "Globi me Shqipërinë si tregu fillestar i ECONERA"} className="w-full">
        <defs>
          <radialGradient id="g-sphere" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#0f4a43" /><stop offset="1" stopColor="#031a16" /></radialGradient>
          <radialGradient id="g-glow"><stop offset="0" stopColor="#c8f169" stopOpacity=".7" /><stop offset="1" stopColor="#c8f169" stopOpacity="0" /></radialGradient>
          <clipPath id="g-clip"><circle cx="240" cy="210" r="190" /></clipPath>
        </defs>
        <circle cx="240" cy="210" r="190" fill="url(#g-sphere)" />
        <g clipPath="url(#g-clip)" fill="none" stroke="#c8f169" strokeOpacity=".16">
          {[-150, -100, -50, 0, 50, 100, 150].map((y) => <ellipse key={`p${y}`} cx="240" cy={210 + y} rx={Math.sqrt(190 * 190 - y * y)} ry={Math.max(6, 22 - Math.abs(y) / 9)} />)}
          {[0, 40, 80, 120, 160].map((rx) => <ellipse key={`m${rx}`} cx="240" cy="210" rx={rx} ry="190" />)}
        </g>
        {future.map(([x, y], i) => (
          <g key={i}>
            <path d={`M${al.x} ${al.y} Q ${(al.x + x) / 2} ${Math.min(al.y, y) - 60} ${x} ${y}`} fill="none" stroke="#c8f169" strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="3 5" />
            <circle cx={x} cy={y} r="3.5" fill="#e9f3ee" fillOpacity=".45" />
          </g>
        ))}
        <circle cx={al.x} cy={al.y} r="34" fill="url(#g-glow)" />
        <circle cx={al.x} cy={al.y} r="7" fill="#c8f169" />
        <circle cx={al.x} cy={al.y} r="13" fill="none" stroke="#c8f169" strokeOpacity=".6" />
        <text x={al.x + 18} y={al.y - 12} fill="#ffffff" fontSize="15" fontWeight="600">{lang === "en" ? "Albania & Kosovo" : "Shqipëri & Kosovë"}</text>
        <text x={al.x + 18} y={al.y + 6} fill="#c8f169" fontSize="12">{lang === "en" ? "Starting market" : "Tregu fillestar"}</text>
      </svg>
      <figcaption className="mt-3 text-center text-sm text-[#5b6b66] dark:text-ink-2">{lang === "en" ? "Faint points: markets we plan to reach, not yet active." : "Pikat e zbehta: tregje që synojmë, ende jo aktive."}</figcaption>
    </figure>
  );
}
