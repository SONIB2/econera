import type { Metadata } from "next";
import Link from "next/link";
import { BasketIcon, CutIcon, RenovationIcon, VoiceIcon } from "@/components/site/tool-icons";
import { BasketPreview, CutPreview, RenovationPreview, VoicePreview } from "@/components/tools/tool-previews";
import { aiStatus } from "@/lib/ai/providers";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: "AI Tools", description: tr(lang, "AI Renovation, Smart Basket, SmartCut dhe ECONERA Voice: katër mjete inteligjente për ndërtimin qarkullues.", "AI Renovation, Smart Basket, SmartCut and ECONERA Voice: four intelligent tools for circular construction.") };
}

type Tool = {
  id: string; name: string; href: string; voice?: boolean; Icon: (p: { className?: string }) => React.JSX.Element; Preview: () => React.JSX.Element;
  long: string; beta?: string; learn: [string, string][];
};

export default async function AiToolsPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const ai = aiStatus();
  const ink = "text-[#0c2f2b] dark:text-ink";
  const soft = "text-[#3d5c55] dark:text-ink-2";

  const tools: Tool[] = [
    {
      id: "renovation", name: "AI Renovation", href: "/ai/renovim", Icon: RenovationIcon, Preview: RenovationPreview,
      long: t("Ktheje foton e një dhome në një koncept dizajni të qëndrueshëm, të lidhur me materiale reale nga tregu i ECONERA.", "Turn a room photo into a sustainable design concept, connected to real materials from the ECONERA Marketplace."),
      beta: ai.analysis ? undefined : t("Beta: llogaritja e materialeve nga përmasat funksionon; analiza e fotos me AI aktivizohet së shpejti.", "Beta: material estimates from room dimensions work today; AI photo analysis is being switched on."),
      learn: [
        [t("Si funksionon", "How it works"), t("Fut përmasat e dhomës, stilin dhe buxhetin; opsionalisht një foto. ECONERA llogarit sasitë (dysheme, bojë, pllaka) dhe i kërkon në treg.", "Enter the room size, style and budget, optionally with a photo. ECONERA estimates quantities (flooring, paint, tiles) and looks for them on the marketplace.")],
        [t("Çfarë të duhet", "What you need"), t("Përmasat e dhomës. Fotoja është opsionale dhe dërgohet vetëm kur e zgjedh ti.", "Room dimensions. The photo is optional and only sent when you choose to.")],
        [t("Kufizimet", "Limitations"), t("Sasitë janë vlerësime me rezervë; kontrolloji me mjeshtrin para blerjes.", "Quantities are estimates with a margin; check them with your builder before buying.")],
        [t("Përfitimi", "Benefit"), t("Lista kalon direkt te Smart Basket, pa e shkruar sërish.", "The list moves straight to Smart Basket without retyping.")],
      ],
    },
    {
      id: "basket", name: "Smart Basket", href: "/ai/shporta", Icon: BasketIcon, Preview: BasketPreview,
      long: t("Ndërto listën, krahaso shitësit dhe gjej kombinimin më të mirë të materialeve në dispozicion brenda buxhetit.", "Build your material list, compare sellers and find the best available combination of materials within your project budget."),
      learn: [
        [t("Si funksionon", "How it works"), t("Shkruaj listën ose ngarko CSV. Mjeti kërkon listimet e miratuara dhe propozon kombinimin më të lirë që mbulon sasitë.", "Write your list or upload a CSV. The tool searches approved listings and proposes the cheapest combination that covers the quantities.")],
        [t("Çfarë të duhet", "What you need"), t("Materialet dhe sasitë; opsionalisht qyteti për transportin.", "Materials and quantities; optionally your city for transport.")],
        [t("Kufizimet", "Limitations"), t("Përdor vetëm stokun real të miratuar; kur tregu është bosh, rezultatet janë të pakta.", "Uses only real approved stock; while the marketplace is new, results are limited.")],
        [t("Përfitimi", "Benefit"), t("Materialet e zgjedhura kalojnë në shportë dhe dërgohen si kërkesa oferte.", "Selected materials go to the cart and are sent as quote requests.")],
      ],
    },
    {
      id: "smartcut", name: "SmartCut", href: "/ai/smartcut", Icon: CutIcon, Preview: CutPreview,
      long: t("Krijo plane prerjeje të optimizuara, gjej copat e mbetura të përshtatshme dhe ul mbetjet e panevojshme.", "Generate optimized cutting plans, discover suitable leftover materials and minimize unnecessary material waste."),
      learn: [
        [t("Si funksionon", "How it works"), t("Fut copat që të duhen dhe përmasat e panelit. Algoritmi i vendos në panele dhe tregon përdorimin dhe mbetjet.", "Enter the pieces you need and the panel size. The algorithm places them on panels and shows utilisation and waste.")],
        [t("Çfarë të duhet", "What you need"), t("Përmasat e copave në mm dhe materiali.", "Piece sizes in mm and the material.")],
        [t("Kufizimet", "Limitations"), t("Prerje drejtkëndëshe; trashësia e diskut merret parasysh sipas cilësimit.", "Rectangular cuts; blade width is applied as set.")],
        [t("Përfitimi", "Benefit"), t("Kontrollon edhe copat në treg para se të blesh panel të ri.", "Checks marketplace offcuts before you buy a new sheet.")],
      ],
    },
    {
      id: "voice", name: "ECONERA Voice", href: "#asistenti", voice: true, Icon: VoiceIcon, Preview: VoicePreview,
      long: t("Kërko, publiko dhe menaxho materialet e ndërtimit me komanda zanore natyrale.", "Search, publish and manage construction materials using natural voice commands."),
      beta: t("Beta: punon në shfletuesit që mbështesin njohjen e zërit (p.sh. Chrome); mikrofoni hapet vetëm kur e shtyp ti.", "Beta: works in browsers with speech recognition (e.g. Chrome); the microphone only opens when you press it."),
      learn: [
        [t("Si funksionon", "How it works"), t("Hap asistentin, shtyp mikrofonin dhe fol. Ai kërkon në treg, plotëson listime ose shton në shportë.", "Open the assistant, press the microphone and speak. It searches the marketplace, drafts listings or adds to your cart.")],
        [t("Gjuhët", "Languages"), t("Shqip dhe anglisht, sipas mbështetjes së shfletuesit.", "Albanian and English, depending on browser support.")],
        [t("Siguria", "Safety"), t("Publikimi, blerja dhe çdo veprim i rëndësishëm kërkojnë konfirmimin tënd.", "Publishing, buying and any consequential action require your confirmation.")],
      ],
    },
  ];
  const flow = [
    [t("Ide ose foto", "Idea or photo"), t("Nis me një foto dhome, një ide projekti ose një komandë zanore.", "Start with a room photograph, project idea or voice command."), "M4 5.5h16v13H4zM4 15l4.5-4.5 4 4 2.5-2.5 5 5M15.5 9.5h.01"],
    [t("Materiale dhe opsione", "Materials and options"), t("Merr sasitë e nevojshme dhe krahaso produktet në treg.", "Generate material requirements and compare available marketplace products."), "M3.5 5h2l1.8 9h9.2l1.7-6.5H6"],
    [t("Optimizim", "Optimization"), t("Optimizo sasitë, kostot e blerjes dhe planet e prerjes.", "Optimize quantities, purchasing costs and cutting plans where applicable."), "m12 4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4"],
    [t("Blerje ose veprim", "Purchase or action"), t("Kalo materialet në shportë, kontakto furnitorët ose menaxho projektin.", "Transfer selected materials to the cart, contact suppliers or manage the project."), "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12l2.5 2.5 4.5-5"],
  ];

  return (
    <div className="bg-[#fbfaf7] dark:bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#0c2f2b]/5 bg-[radial-gradient(ellipse_60%_80%_at_85%_40%,rgba(200,241,105,0.22),transparent_70%)] dark:border-line">
        <div className="container-x grid items-center gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:py-16">
          <div>
            <p className="inline-flex rounded-full bg-[#e6f6c4] px-3 py-1 text-xs font-bold tracking-wide text-[#2f5d10] dark:bg-lime/15 dark:text-lime">ECONERA AI TOOLS</p>
            <h1 className={`display mt-4 text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.04] ${ink}`}>{t("Eksploro katër mjete inteligjente për ndërtimin qarkullues.", "Explore four intelligent tools for circular construction.")}</h1>
            <p className={`mt-4 max-w-xl text-lg ${soft}`}>{t("Dizajno, gjej, optimizo dhe menaxho materialet e ndërtimit me AI, të gjitha në një vend.", "Design, source, optimize and manage construction materials with AI, all in one place.")}</p>
            <a href="#mjetet" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#0f4a43] px-6 font-semibold text-white transition hover:bg-[#0c3a35] dark:bg-lime dark:text-bg">{t("Eksploro mjetet AI", "Explore AI Tools")} <span aria-hidden>→</span></a>
          </div>
          <div aria-hidden className="relative mx-auto flex w-full max-w-md items-center justify-between py-6">
            <svg viewBox="0 0 400 120" className="absolute inset-x-[-8%] top-1/2 w-[116%] -translate-y-1/2" fill="none"><path d="M4 96 C 90 120, 160 30, 250 54 S 380 20, 396 6" stroke="#c8f169" strokeWidth="5" strokeLinecap="round" opacity=".8" /></svg>
            {tools.map((tool, i) => (
              <span key={tool.id} className="relative grid size-[clamp(58px,8vw,78px)] place-items-center rounded-2xl border border-[#c8f169]/60 bg-gradient-to-b from-[#f4fbe6] to-[#e3f3c6] text-[#2f5d10] shadow-[0_16px_30px_-18px_rgba(47,93,16,0.7)] dark:from-[#0f3a33] dark:to-[#0b2e29] dark:text-lime" style={{ transform: `translateY(${[8, -6, -14, -22][i]}px)` }}>
                <tool.Icon className="size-1/2" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed showcases */}
      <section id="mjetet" aria-labelledby="eksploro" className="container-x scroll-mt-24 pt-12 pb-14">
        <h2 id="eksploro" className={`display text-3xl md:text-4xl ${ink}`}>{t("Eksploro mjetet", "Explore the tools")}</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {tools.map((tool) => (
            <article key={tool.id} id={tool.id} className="scroll-mt-24 rounded-[1.5rem] border border-[#0c2f2b]/10 bg-white p-5 shadow-[0_14px_40px_-30px_rgba(12,47,43,0.55)] md:p-6 dark:border-line dark:bg-card">
              <div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
                <div>
                  <span className="grid size-11 place-items-center rounded-xl bg-[#e6f6c4] text-[#2f5d10] dark:bg-lime/15 dark:text-lime"><tool.Icon /></span>
                  <h2 className={`mt-3 flex flex-wrap items-center gap-2 text-2xl font-semibold ${ink}`}>{tool.name}{tool.beta && <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-[11px] font-bold text-[#7a5a0c]">BETA</span>}</h2>
                  <p className={`mt-2 text-[15px] leading-relaxed ${soft}`}>{tool.long}</p>
                  <div className="mt-5 grid gap-2 sm:max-w-[11rem]">
                    {tool.voice
                      ? <a href="#asistenti" data-open-assistant="" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#0f4a43] px-4 text-sm font-semibold text-white hover:bg-[#0c3a35] dark:bg-lime dark:text-bg">{t("Hap asistentin", "Open assistant")} <span aria-hidden>→</span></a>
                      : <Link href={tool.href} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#0f4a43] px-4 text-sm font-semibold text-white hover:bg-[#0c3a35] dark:bg-lime dark:text-bg">{t("Hap mjetin", "Open tool")} <span aria-hidden>→</span></Link>}
                  </div>
                </div>
                <tool.Preview />
              </div>
              <details className="group mt-4 border-t border-[#0c2f2b]/10 pt-3 dark:border-line">
                <summary className={`inline-flex h-9 cursor-pointer list-none items-center rounded-full border border-[#0c2f2b]/20 px-4 text-sm font-semibold hover:border-[#0c2f2b] dark:border-line [&::-webkit-details-marker]:hidden ${ink}`}>{t("Mëso më shumë", "Learn more")}<span aria-hidden className="ml-1.5 transition group-open:rotate-180">⌄</span></summary>
                {tool.beta && <p className="mt-3 rounded-xl bg-[#fff8e6] px-3 py-2 text-sm text-[#6b500d] dark:bg-bg-2 dark:text-ink-2">{tool.beta}</p>}
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {tool.learn.map(([k, v]) => <div key={k}><dt className={`text-sm font-semibold ${ink}`}>{k}</dt><dd className={`mt-0.5 text-sm ${soft}`}>{v}</dd></div>)}
                </dl>
              </details>
            </article>
          ))}
        </div>
      </section>

      {/* How they work together */}
      <section aria-labelledby="bashke" className="container-x pb-16">
        <div className="grid gap-8 rounded-[1.5rem] border border-[#0c2f2b]/10 bg-[#f0f3ee] p-6 md:p-8 lg:grid-cols-[0.8fr_2.2fr] lg:items-center dark:border-line dark:bg-bg-2">
          <div>
            <h2 id="bashke" className={`display text-3xl leading-tight ${ink}`}>{t("Si punojnë së bashku", "How they work together")}</h2>
            <p className={`mt-2 ${soft}`}>{t("Një rrjedhë e thjeshtë nga ideja te veprimi, për ndërtimin qarkullues.", "A simple flow from idea to action, designed for circular construction.")}</p>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map(([name, text, d], i) => (
              <li key={name} className="relative flex gap-3 lg:flex-col lg:items-center lg:text-center">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#c8f169]/70 bg-white text-[#2f5d10] dark:bg-card dark:text-lime"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg></span>
                <span><span className={`block font-semibold ${ink}`}>{i + 1}. {name}</span><span className={`mt-0.5 block text-sm ${soft}`}>{text}</span></span>
                {i < 3 && <span aria-hidden className="absolute top-3 -right-4 hidden text-[#3f7a17] lg:block">→</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
