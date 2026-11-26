"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/(legacy)/account-actions";
import { useLang } from "@/components/lang-provider";
import { ArrowIcon, TOOL_ICON } from "./tool-icons";
import { CartButton, RegionMenu, ThemeToggle } from "./header-controls";

export type Account = { email: string; seller: boolean } | null;

const TOOLS = [
  { id: "renovation", href: "/ai/renovim", name: "AI Renovation", sq: "Dizajno hapësirën tënde me AI.", en: "Design your space with AI." },
  { id: "basket", href: "/ai/shporta", name: "Smart Basket", sq: "Materialet më të mira për buxhetin tënd.", en: "Find the best materials for your budget." },
  { id: "smartcut", href: "/ai/smartcut", name: "SmartCut", sq: "Optimizo materialet. Minimizo mbetjet.", en: "Optimize materials. Minimize waste." },
  { id: "voice", href: "#asistenti", name: "ECONERA Voice", sq: "Asistenti yt inteligjent me zë.", en: "Your intelligent voice assistant.", voice: true },
] as const;

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
  const [aiOpen, setAiOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverMega = (open: boolean) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMega(open), open ? 80 : 180);
  };
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
    <header className={`${overlay ? "fixed inset-x-0" : "sticky"} top-0 z-40 px-3 pt-3 transition-[padding] sm:px-5 ${overlay ? "theme-dark" : ""} ${onHero ? "!bg-transparent" : ""}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border pr-2 pl-5 transition-all duration-300 sm:pl-6 ${scrolled && !onHero ? "h-14" : "h-16"} ${onHero ? "border-transparent bg-transparent" : scrolled ? "border-line bg-card/85 shadow-[0_10px_30px_-18px_rgba(12,47,43,0.35)] backdrop-blur-xl" : "border-line/70 bg-card/60 backdrop-blur-md"}`}>
        <Link href="/" aria-label={t("ECONERA, kreu", "ECONERA, home")} className="flex shrink-0 items-center">
          <Image src="/brand/logo-light.svg" alt="" width={481} height={66} priority className="h-6 w-auto dark:hidden" />
          <Image src="/brand/logo-dark.svg" alt="" width={481} height={66} priority className="hidden h-6 w-auto dark:block" />
        </Link>

        <nav aria-label={t("Navigimi kryesor", "Main navigation")} className="hidden items-center gap-0.5 lg:flex">
          {nav.map((n) => link(n.href, n.label))}
          <div ref={megaRef} className="relative" onMouseEnter={() => hoverMega(true)} onMouseLeave={() => hoverMega(false)}>
            <button type="button" aria-expanded={mega} aria-controls="mega-ai" onClick={() => setMega((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${mega || active("/ai") ? "text-ink" : "text-ink-2 hover:text-ink"} ${active("/ai") ? "bg-bg-2" : ""}`}>
              {t("Mjetet AI", "AI Tools")}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={`transition duration-200 ${mega ? "rotate-180" : ""}`}><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
            </button>
            {/* Compact Intelligence dropdown: two columns, icon + name + one line, whole row clickable. */}
            <div id="mega-ai" inert={!mega} className={`absolute top-full left-1/2 z-50 w-[min(700px,calc(100vw-2rem))] -translate-x-1/2 pt-3 transition duration-200 ease-out ${mega ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
              <div className="overflow-hidden rounded-2xl border border-line bg-card text-ink shadow-[0_24px_60px_-24px_rgba(6,34,30,0.45)]">
                <p className="px-5 pt-4 text-[11px] font-semibold tracking-[0.14em] text-lime-dim">ECONERA INTELLIGENCE</p>
                <ul className="grid grid-cols-2 gap-1 p-2.5">
                  {TOOLS.map((tool) => {
                    const Icon = TOOL_ICON[tool.id];
                    return (
                      <li key={tool.id}>
                        <Link href={tool.href} data-open-assistant={"voice" in tool ? "" : undefined} onClick={() => setMega(false)}
                          className="group flex items-center gap-3.5 rounded-xl p-2.5 outline-none transition-colors hover:bg-bg-2 focus-visible:bg-bg-2 focus-visible:ring-2 focus-visible:ring-lime">
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-2 text-lime transition-colors group-hover:border-lime/50 group-hover:bg-accent/60"><Icon /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-semibold tracking-tight">{tool.name}</span>
                            <span className="block text-[13px] leading-snug text-ink-2">{tool[lang]}</span>
                          </span>
                          <ArrowIcon className="shrink-0 text-ink-2 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lime" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link href="/ai" onClick={() => setMega(false)} className="group flex items-center justify-between border-t border-line px-5 py-3.5 text-sm font-semibold text-lime outline-none transition-colors hover:bg-bg-2 focus-visible:bg-bg-2">
                  {t("Eksploro të gjitha mjetet AI", "Explore all AI tools")}
                  <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>
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
          {nav.map((n) => <li key={n.href}><Link href={n.href} onClick={() => setMobileOn(null)} className="flex min-h-12 items-center rounded-xl px-3 text-base font-medium hover:bg-bg-2">{n.label}</Link></li>)}
          <li>
            <button type="button" aria-expanded={aiOpen} aria-controls="menu-ai" onClick={() => setAiOpen((v) => !v)}
              className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-3 text-left text-base font-medium transition-colors ${aiOpen ? "bg-bg-2 text-lime" : "hover:bg-bg-2"}`}>
              {t("Mjetet AI", "AI Tools")}
              <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={`ml-auto transition duration-200 ${aiOpen ? "rotate-180" : ""}`}><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
            </button>
            <div id="menu-ai" className={`grid transition-[grid-template-rows] duration-300 ease-out ${aiOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden" inert={!aiOpen}>
                <ul className="grid gap-0.5 py-1.5 pl-2">
                  {TOOLS.map((tool) => {
                    const Icon = TOOL_ICON[tool.id];
                    return (
                      <li key={tool.id}>
                        <Link href={tool.href} data-open-assistant={"voice" in tool ? "" : undefined} onClick={() => setMobileOn(null)} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 hover:bg-bg-2">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-bg-2 text-lime"><Icon /></span>
                          <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{tool.name}</span><span className="block text-[13px] text-ink-2">{tool[lang]}</span></span>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="shrink-0 text-ink-2"><path d="M5 3l4 4-4 4" strokeLinecap="round" /></svg>
                        </Link>
                      </li>
                    );
                  })}
                  <li><Link href="/ai" onClick={() => setMobileOn(null)} className="flex min-h-12 items-center px-2 text-sm font-semibold text-lime">{t("Eksploro të gjitha mjetet", "Explore all tools")} <span aria-hidden className="ml-1">→</span></Link></li>
                </ul>
              </div>
            </div>
          </li>
          <li><Link href="/biznes" onClick={() => setMobileOn(null)} className="flex min-h-12 items-center rounded-xl px-3 text-base font-medium hover:bg-bg-2">{t("Për bizneset", "For Business")}</Link></li>
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <ThemeToggle />
          {account ? <Link href="/paneli" className="btn-ghost">{t("Llogaria ime", "My account")}</Link> : <span className="flex gap-2"><Link href="/hyr" className="btn-ghost">{t("Hyr", "Log in")}</Link><Link href="/regjistrohu" className="btn-primary">{t("Regjistrohu", "Sign up")}</Link></span>}
        </div>
      </nav>
    </header>
  );
}
