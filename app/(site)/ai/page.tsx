import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: "AI Tools", description: tr(lang, "AI Renovation, Smart Basket, SmartCut dhe ECONERA Voice: nga ideja te plani i blerjes me materiale reale.", "AI Renovation, Smart Basket, SmartCut and ECONERA Voice: from idea to purchasing plan with real materials.") };
}

export default async function AiToolsPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const tools = [
    { href: "/ai/renovim", name: "AI Renovation", text: t("Transformo hapësirën me materiale reale dhe të qëndrueshme.", "Transform your space using real, sustainable materials."), visual: <RenovationVisual /> },
    { href: "/ai/shporta", name: "Smart Basket", text: t("Kombinimi më i mirë i materialeve brenda buxhetit tënd.", "Find the best combination of materials within your budget."), visual: <BasketVisual /> },
    { href: "/ai/smartcut", name: "SmartCut", text: t("Copëzat e mbetura kthehen në prerje të optimizuara.", "Turn leftover materials into optimised construction solutions."), visual: <CutVisual /> },
    { href: "#asistenti", name: "ECONERA Voice", text: t("Kërko, shit dhe menaxho materialet me zë.", "Search, sell and manage materials using your voice."), visual: <VoiceVisual />, voice: true },
  ];
  const flow = [
    [t("Ide ose foto", "Idea or photo"), "Voice · AI Renovation"],
    [t("Lista e materialeve", "Material list"), t("Vlerësim nga masat", "Estimated from measurements")],
    [t("Stoku real", "Real stock"), "Smart Basket"],
    [t("Copëzat", "Offcuts"), "SmartCut"],
    [t("Plani i blerjes", "Purchasing plan"), t("Oferta, transport, kursim, CO₂", "Quotes, transport, savings, CO₂")],
  ];

  return (
    <>
      <section className="container-x pt-16 pb-12 text-center md:pt-24">
        <p className="eyebrow-pill">AI Tools</p>
        <h1 className="display mx-auto mt-6 max-w-4xl text-[2.9rem] sm:text-6xl md:text-[5rem]">{t("Më shumë se një treg. Një mënyrë më e zgjuar për të ndërtuar.", "More than a marketplace. A smarter way to build.")}</h1>
        <p className="lead mx-auto mt-6 max-w-2xl text-balance">{t("Katër mjete që punojnë bashkë: nga ideja te materialet që mund t'i blesh sot, me më pak shpenzim dhe më pak mbetje.", "Four tools that work together: from an idea to materials you can buy today, spending less and wasting less.")}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/ai/renovim" className="btn-primary">{t("Nis rinovimin tënd të zgjuar", "Start your smart renovation")}</Link><Link href="/projektet" className="btn-ghost">{t("Projektet e mia", "My projects")}</Link></div>
      </section>

      <section className="container-x grid gap-5 pb-16 sm:grid-cols-2" aria-label={t("Mjetet", "Tools")}>
        {tools.map((tool) => (
          <Link key={tool.name} href={tool.href} className="group card overflow-hidden transition hover:border-lime/60" data-open-assistant={tool.voice ? "" : undefined}>
            <div className="aspect-[16/8] overflow-hidden border-b border-line bg-bg-2">{tool.visual}</div>
            <div className="flex items-end justify-between gap-4 p-6">
              <div><h2 className="text-2xl">{tool.name}</h2><p className="mt-1 text-ink-2">{tool.text}</p></div>
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full border border-line transition group-hover:border-lime group-hover:bg-lime group-hover:text-bg">↗</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="border-t border-line bg-bg-2" aria-labelledby="rrjedha">
        <div className="container-x py-16">
          <h2 id="rrjedha" className="text-3xl md:text-4xl">{t("Nga ideja te plani i blerjes.", "From idea to purchasing plan.")}</h2>
          <p className="mt-2 max-w-2xl text-ink-2">{t("Të dhënat kalojnë nga një mjet te tjetri, pa i shkruar dy herë.", "Data moves from one tool to the next, without typing it twice.")}</p>
          <ol className="mt-8 grid gap-3 md:grid-cols-5">
            {flow.map(([a, b], i) => (
              <li key={a} className="relative rounded-xl border border-line bg-card p-4">
                <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-semibold text-lime">{i + 1}</span>
                <p className="mt-3 font-semibold">{a}</p>
                <p className="text-sm text-ink-2">{b}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink-2">{t("Llogaritjet janë të përcaktuara dhe të shpjegueshme. AI përdoret për të kuptuar fotot dhe gjuhën; çdo veprim i rëndësishëm kërkon konfirmimin tënd.", "Calculations are deterministic and explainable. AI is used to understand photos and language; every consequential action needs your confirmation.")}</p>
        </div>
      </section>
    </>
  );
}

function RenovationVisual() {
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="200" height="200" fill="#dfe5e1" /><rect x="200" width="200" height="200" fill="#f1ece2" />
      <path d="M0 150h200" stroke="#a9b3ae" strokeWidth="2" /><rect x="30" y="60" width="60" height="70" fill="#c8cfcb" /><rect x="110" y="110" width="70" height="40" fill="#b3bcb7" />
      <path d="M200 150h200" stroke="#c9b48f" strokeWidth="2" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={200 + i * 25} y={150} width={24} height={50} fill={i % 2 ? "#d8bf95" : "#cfb387"} />)}
      <rect x="230" y="60" width="60" height="70" fill="#fbfaf6" stroke="#d9cdb6" /><rect x="310" y="105" width="70" height="45" rx="8" fill="#8ea38f" />
      <circle cx="350" cy="50" r="18" fill="#c8f169" opacity=".7" /><path d="M200 0v200" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
function BasketVisual() {
  const rows = [["Parket lisi", "#cfb387", 0.82], ["Pllaka bezhë", "#e5d6bb", 0.6], ["Dyer", "#9fb3a6", 0.44], ["Bojë", "#f3efe6", 0.3]] as const;
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="400" height="200" fill="#e9f1ec" />
      {rows.map(([l, c, w], i) => <g key={l}><rect x="40" y={28 + i * 38} width={320} height="28" rx="14" fill="#fff" /><rect x="40" y={28 + i * 38} width={320 * w} height="28" rx="14" fill={c} /><text x="54" y={47 + i * 38} fontSize="12" fill="#0c2f2b" fontFamily="sans-serif">{l}</text></g>)}
    </svg>
  );
}
function CutVisual() {
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="400" height="200" fill="#e9f1ec" /><rect x="60" y="25" width="280" height="150" fill="#fff" stroke="#0f4a43" strokeWidth="2" />
      <rect x="64" y="29" width="110" height="70" fill="#cfe8c0" stroke="#0c2f2b" /><rect x="178" y="29" width="90" height="70" fill="#e7d7b0" stroke="#0c2f2b" /><rect x="64" y="103" width="80" height="68" fill="#bcd7e8" stroke="#0c2f2b" />
      <rect x="148" y="103" width="120" height="68" fill="#e9c9c0" stroke="#0c2f2b" /><rect x="272" y="29" width="64" height="142" fill="#f4f8f5" stroke="#7fb52a" strokeDasharray="6 4" />
      {[["A", 119, 68], ["B", 223, 68], ["C", 104, 141], ["D", 208, 141]].map(([l, x, y]) => <text key={l} x={x} y={y} fontSize="16" fontWeight="600" textAnchor="middle" fill="#0c2f2b" fontFamily="sans-serif">{l}</text>)}
    </svg>
  );
}
function VoiceVisual() {
  const bars = [14, 26, 40, 22, 52, 30, 64, 38, 24, 46, 18, 34, 12];
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="400" height="200" fill="#e9f1ec" /><circle cx="200" cy="100" r="54" fill="#dcf3b8" /><circle cx="200" cy="100" r="36" fill="#0f4a43" />
      <rect x="192" y="80" width="16" height="28" rx="8" fill="none" stroke="#fff" strokeWidth="3" /><path d="M184 102a16 16 0 0 0 32 0M200 118v8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      {bars.map((h, i) => <rect key={i} x={30 + i * 9} y={100 - h / 2} width="4" height={h} rx="2" fill="#7fb52a" />)}
      {bars.map((h, i) => <rect key={`r${i}`} x={262 + i * 9} y={100 - h / 2} width="4" height={h} rx="2" fill="#7fb52a" />)}
    </svg>
  );
}
