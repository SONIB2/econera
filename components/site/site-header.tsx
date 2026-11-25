"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/(legacy)/account-actions";
import { useLang } from "@/components/lang-provider";
import { TOOL_PHOTO, unsplash } from "@/lib/market/photos";
import { CartButton, RegionMenu, ThemeToggle } from "./header-controls";

export type Account = { email: string; seller: boolean } | null;

const TOOLS = [
  { href: "/ai/renovim", name: "AI Renovation", tag: { sq: "Nga mbetja te dizajni", en: "From waste to design" }, sq: "Dizajno hapësirën dhe gjej materiale reale në ECONERA.", en: "Design your space and find real materials on ECONERA.", photo: TOOL_PHOTO.renovation },
  { href: "/ai/shporta", name: "Smart Basket", tag: { sq: "Blerje më e zgjuar", en: "Smarter procurement" }, sq: "Kombinimi më i mirë i materialeve për projektin dhe buxhetin tënd.", en: "The best combination of materials for your project and budget.", photo: TOOL_PHOTO.basket },
  { href: "/ai/smartcut", name: "SmartCut", tag: { sq: "Çdo copë ka vlerë", en: "Make every piece count" }, sq: "Optimizo prerjen dhe gjej copat e mbetura që të duhen.", en: "Optimise cutting and find the offcuts you need.", photo: TOOL_PHOTO.smartcut },
  { href: "#asistenti", name: "ECONERA Voice", tag: { sq: "Asistent i aksesueshëm", en: "Accessible assistant" }, sq: "Kërko, publiko dhe menaxho materialet me zë.", en: "Search, publish and manage materials by voice.", photo: TOOL_PHOTO.voice, voice: true },
];

/**
 * Global header: Logo | Marketplace | Sell | AI Tools (mega menu) | For Business | region | theme | cart | Log in · Sign up.
 * `overlay` keeps it transparent over the homepage hero until the visitor scrolls past it.
 */
export function SiteHeader({ account, overlay = false }: { account: Account; overlay?: boolean }) {
  const pathname = usePathname();
  const { lang, t } = useLang();
  const [mobileOn, setMobileOn] = useState<string | null>(null);
  const mobile = mobileOn === pathname;
  const [mega, setMega] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(!overlay);
  const megaRef = useRef<HTMLDivElement>(null);
  const accRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 8); if (overlay) setPastHero(window.scrollY > window.innerHeight - 90); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);
  useEffect(() => {
    if (!mega && !accountOpen && !mobile) return;
    const down = (e: PointerEvent) => {
      if (mega && !megaRef.current?.contains(e.target as Node)) setMega(false);
      if (accountOpen && !accRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setMega(false); setAccountOpen(false); setMobileOn(null); } };
    window.addEventListener("pointerdown", down); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", down); window.removeEventListener("keydown", key); };
  }, [mega, accountOpen, mobile]);

  const onHero = overlay && !pastHero && !mobile;
  const active = (href: string) => pathname.startsWith(href);
  const nav = [
    { href: "/treg", label: t("Tregu i materialeve", "Marketplace") },
    { href: "/shit", label: t("Shit", "Sell") },
  ];
  const accountLinks = [
    ["/paneli", t("Paneli", "Dashboard")], ["/projektet", t("Projektet e mia", "My projects")], ["/ruajtura", t("Të ruajturat", "Saved materials")],
    ["/inventari/ofertat", t("Porositë dhe ofertat", "Orders and quotes")], ["/njoftimet", t("Njoftimet", "Notifications")], ["/mbrojtja", t("Mesazhet dhe ankesat", "Messages and complaints")],
    ["/inventari", t("Listimet e mia", "My listings")], ["/verifikimi", t("Verifikimi i llogarisë", "Account verification")],
  ];
  const link = (href: string, label: string) => (
    <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${active(href) ? "bg-bg-2 text-ink" : "text-ink-2 hover:text-ink"}`}>{label}</Link>
  );

  return (
    <header className={`${overlay ? "fixed inset-x-0" : "sticky"} top-0 z-40 px-3 pt-3 transition-[padding] sm:px-5 ${onHero ? "theme-dark !bg-transparent" : ""}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border pr-2 pl-5 transition-all duration-300 sm:pl-6 ${scrolled && !onHero ? "h-14" : "h-16"} ${onHero ? "border-transparent bg-transparent" : scrolled ? "border-line bg-card/85 shadow-[0_10px_30px_-18px_rgba(12,47,43,0.35)] backdrop-blur-xl" : "border-line/70 bg-card/60 backdrop-blur-md"}`}>
        <Link href="/" aria-label={t("ECONERA, kreu", "ECONERA, home")} className="flex shrink-0 items-center">
          <Image src="/brand/logo-light.svg" alt="" width={481} height={66} priority className="h-6 w-auto dark:hidden" />
          <Image src="/brand/logo-dark.svg" alt="" width={481} height={66} priority className="hidden h-6 w-auto dark:block" />
        </Link>

        <nav aria-label={t("Navigimi kryesor", "Main navigation")} className="hidden items-center gap-0.5 lg:flex">
          {nav.map((n) => link(n.href, n.label))}
          <div ref={megaRef} className="relative">
            <button type="button" aria-expanded={mega} aria-controls="mega-ai" onClick={() => setMega((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium ${active("/ai") ? "bg-bg-2 text-ink" : "text-ink-2 hover:text-ink"}`}>
              {t("Mjetet AI", "AI Tools")}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={`transition ${mega ? "rotate-180" : ""}`}><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
            </button>
            {mega && (
              <div id="mega-ai" className="fixed inset-x-0 top-[5.75rem] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-line bg-card text-ink shadow-[0_30px_80px_-30px_rgba(6,34,30,0.45)]">
                <div className="flex items-end justify-between gap-6 px-6 pt-5 pb-4">
                  <div><p className="text-xs font-medium text-lime-dim">{t("Mjete me inteligjencë artificiale", "AI Tools")}</p><p className="mt-1 text-lg font-semibold tracking-tight">{t("Më shumë se një treg. Një mënyrë më e zgjuar për të ndërtuar.", "More than a marketplace. A smarter way to build.")}</p></div>
                  <Link href="/ai" onClick={() => setMega(false)} className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-lime">{t("Të gjitha mjetet", "All tools")}</Link>
                </div>
                <ul className="grid grid-cols-4 gap-3 px-4 pb-4">
                  {TOOLS.map(({ href, name, tag, photo, voice, ...d }) => (
                    <li key={name}>
                      <Link href={href} data-open-assistant={voice ? "" : undefined} onClick={() => setMega(false)} className="group block rounded-2xl p-1.5 outline-none hover:bg-bg-2 focus-visible:bg-bg-2">
                        <span className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-bg-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={unsplash(photo, 480, 600)} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
                          <span className="absolute inset-0 bg-gradient-to-t from-[#04211d]/90 via-[#04211d]/20 to-transparent" />
                          <span className="absolute top-3 left-3 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">{tag[lang]}</span>
                          <span className="absolute inset-x-3 bottom-3 text-[17px] font-semibold tracking-tight text-white">{name}</span>
                        </span>
                        <span className="block px-1.5 pt-3 pb-1 text-[13px] leading-snug text-ink-2">{d[lang]}</span>
                        <span className="block px-1.5 pb-1 text-xs font-semibold text-lime-dim group-hover:underline">{voice ? t("Hap asistentin", "Open assistant") : t("Hap mjetin", "Open tool")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-line bg-bg-2/60 px-6 py-3 text-xs text-ink-2">{t("Mjetet punojnë me stokun real të tregut dhe kalojnë të dhënat nga njëri te tjetri.", "The tools work with real marketplace stock and pass data to each other.")}</div>
              </div>
            )}
          </div>
          {link("/biznes", t("Për bizneset", "For Business"))}
        </nav>

        <div className="flex items-center gap-1">
          <RegionMenu />
          <span className="hidden sm:block"><ThemeToggle /></span>
          <CartButton />
          {account ? (
            <div ref={accRef} className="relative">
              <button type="button" aria-expanded={accountOpen} aria-haspopup="menu" onClick={() => setAccountOpen((v) => !v)} className="ml-1 grid size-10 place-items-center rounded-full bg-lime text-sm font-semibold text-bg" aria-label={t("Llogaria", "Account")}>
                {account.email.slice(0, 1).toUpperCase()}
              </button>
              {accountOpen && (
                <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-card border border-line bg-card p-2 text-ink shadow-2xl">
                  <p className="truncate px-3 py-2 text-xs text-ink-2">{account.email}</p>
                  {accountLinks.map(([href, label]) => <Link key={href} role="menuitem" href={href} onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-bg-2">{label}</Link>)}
                  <form action={signOut}><button role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-2 hover:bg-bg-2">{t("Dil", "Log out")}</button></form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/hyr" className="hidden h-10 items-center rounded-full px-3.5 text-sm font-medium text-ink hover:bg-bg-2 sm:inline-flex">{t("Hyr", "Log in")}</Link>
              <Link href="/regjistrohu" className="btn-primary hidden whitespace-nowrap sm:inline-flex">{t("Regjistrohu", "Sign up")}</Link>
            </>
          )}
          <button type="button" className="ml-1 grid size-10 place-items-center rounded-full border border-line text-ink lg:hidden" aria-expanded={mobile} aria-controls="menu-celular"
            aria-label={mobile ? t("Mbyll menunë", "Close menu") : t("Hap menunë", "Open menu")} onClick={() => setMobileOn(mobile ? null : pathname)}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">{mobile ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 5h14M2 9h14M2 13h14" />}</svg>
          </button>
        </div>
      </div>

      <nav id="menu-celular" aria-label={t("Menuja", "Menu")} hidden={!mobile} className="mx-auto mt-2 max-h-[calc(100dvh-6rem)] max-w-7xl overflow-y-auto rounded-card border border-line bg-card/95 p-3 text-ink shadow-xl backdrop-blur-xl lg:hidden">
        <ul className="grid gap-1">
          {[...nav, { href: "/biznes", label: t("Për bizneset", "For Business") }].map((n) => <li key={n.href}><Link href={n.href} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-bg-2">{n.label}</Link></li>)}
        </ul>
        <p className="mt-3 px-3 text-xs font-medium text-ink-2">{t("Mjetet AI", "AI Tools")}</p>
        <ul className="mt-1 grid grid-cols-2 gap-2">
          {TOOLS.map((tool) => <li key={tool.name}><Link href={tool.href} data-open-assistant={tool.voice ? "" : undefined} className="relative block aspect-[16/10] overflow-hidden rounded-xl">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={unsplash(tool.photo, 360, 220)} alt="" loading="lazy" className="size-full object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-[#04211d]/85 to-transparent" /><span className="absolute inset-x-2.5 bottom-2 text-sm font-semibold text-white">{tool.name}</span></Link></li>)}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <ThemeToggle />
          {account ? <Link href="/paneli" className="btn-ghost">{t("Llogaria ime", "My account")}</Link> : <span className="flex gap-2"><Link href="/hyr" className="btn-ghost">{t("Hyr", "Log in")}</Link><Link href="/regjistrohu" className="btn-primary">{t("Regjistrohu", "Sign up")}</Link></span>}
        </div>
      </nav>
    </header>
  );
}
