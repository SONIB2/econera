"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/(legacy)/account-actions";
import { useLang } from "@/components/lang-provider";
import { BasketVisual, CutVisual, RenovationVisual, VoiceVisual } from "@/components/tools/visuals";
import { CartButton, RegionMenu, ThemeToggle } from "./header-controls";

export type Account = { email: string; seller: boolean } | null;

const TOOLS = [
  { href: "/ai/renovim", name: "AI Renovation", sq: "Nga mbetja te dizajni. Dizajno hapësirën me materiale reale të ECONERA-s.", en: "From waste to design. Design your space and find real materials on ECONERA.", Visual: RenovationVisual },
  { href: "/ai/shporta", name: "Smart Basket", sq: "Blerje më e zgjuar, çmime më të mira. Kombinimi më i mirë për buxhetin tënd.", en: "Smarter procurement, better prices. The best combination for your budget.", Visual: BasketVisual },
  { href: "/ai/smartcut", name: "SmartCut", sq: "Çdo copë ka vlerë. Optimizo prerjen dhe gjej copëzat që të duhen.", en: "Make every piece count. Optimise cutting and find suitable offcuts.", Visual: CutVisual },
  { href: "#asistenti", name: "ECONERA Voice", sq: "Asistenti yt i aksesueshëm. Kërko, publiko dhe menaxho me zë.", en: "Your accessible assistant. Search, publish and manage by voice.", Visual: VoiceVisual, voice: true },
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
              <div id="mega-ai" className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.5rem] border border-line bg-card p-3 text-ink shadow-2xl">
                <ul className="grid grid-cols-2 gap-2">
                  {TOOLS.map(({ href, name, Visual, voice, ...d }) => (
                    <li key={name}>
                      <Link href={href} data-open-assistant={voice ? "" : undefined} onClick={() => setMega(false)} className="group grid grid-cols-[112px_1fr] gap-4 rounded-2xl p-3 hover:bg-bg-2 focus-visible:bg-bg-2">
                        <span className="block aspect-[4/3] overflow-hidden rounded-xl border border-line bg-bg-2">{<Visual />}</span>
                        <span><span className="block font-semibold">{name}</span><span className="mt-1 block text-sm text-ink-2">{d[lang]}</span><span className="mt-2 block text-xs font-medium text-lime">{t("Hap mjetin →", "Open tool →")}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between rounded-2xl bg-bg-2 px-4 py-3 text-sm">
                  <span className="text-ink-2">{t("Mjetet punojnë me stokun real të tregut dhe kalojnë të dhënat nga njëri te tjetri.", "The tools work with real market stock and pass data to each other.")}</span>
                  <Link href="/ai" onClick={() => setMega(false)} className="font-medium text-lime">{t("Të gjitha mjetet", "All tools")}</Link>
                </div>
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
          {TOOLS.map((tool) => <li key={tool.name}><Link href={tool.href} data-open-assistant={tool.voice ? "" : undefined} className="block rounded-xl border border-line px-3 py-3 text-sm font-medium">{tool.name}</Link></li>)}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <ThemeToggle />
          {account ? <Link href="/paneli" className="btn-ghost">{t("Llogaria ime", "My account")}</Link> : <span className="flex gap-2"><Link href="/hyr" className="btn-ghost">{t("Hyr", "Log in")}</Link><Link href="/regjistrohu" className="btn-primary">{t("Regjistrohu", "Sign up")}</Link></span>}
        </div>
      </nav>
    </header>
  );
}
