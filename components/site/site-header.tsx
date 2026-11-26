"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/(legacy)/account-actions";
import { useLang } from "@/components/lang-provider";
import { ArrowIcon, BasketIcon, BuildingIcon, CompassIcon, CutIcon, FactoryIcon, MarketIcon, PriceIcon, RenovationIcon, SellIcon, VoiceIcon } from "./tool-icons";
import { CartButton, RegionMenu, ThemeToggle } from "./header-controls";

export type Account = { email: string; seller: boolean } | null;

type Icon = (p: { className?: string }) => React.ReactElement;
type Item = { href: string; label: string; desc: string; Icon: Icon; voice?: boolean };
type Group = { id: string; label: string; href?: string; items: Item[]; more?: { href: string; label: string }; wide?: boolean; match: string[] };

/** The six main destinations, shared by the desktop bar and the mobile drawer. */
function useNav() {
  const { t } = useLang();
  const groups: Group[] = [
    {
      id: "nav-market", label: t("Tregu", "Marketplace"), href: "/treg", match: ["/treg", "/shit"],
      items: [
        { href: "/treg", label: t("Bli materiale", "Buy Materials"), desc: t("Zbulo materialet e ndërtimit në dispozicion.", "Discover available construction materials."), Icon: MarketIcon },
        { href: "/shit", label: t("Shit materiale", "Sell Materials"), desc: t("Listo materialet e tepërta ose të rikuperuara.", "List your surplus or reclaimed materials."), Icon: SellIcon },
      ],
    },
    {
      id: "nav-ai", label: t("Mjetet AI", "AI Tools"), href: undefined, match: ["/ai"], wide: true,
      more: { href: "/ai", label: t("Shiko të gjitha mjetet AI", "Explore All AI Tools") },
      items: [
        { href: "/ai/renovim", label: "AI Renovation", desc: t("Dizajno hapësirën tënde me AI.", "Design your space with AI."), Icon: RenovationIcon },
        { href: "/ai/shporta", label: "Smart Basket", desc: t("Materialet më të mira për buxhetin tënd.", "The best materials for your budget."), Icon: BasketIcon },
        { href: "/ai/smartcut", label: "SmartCut", desc: t("Optimizo prerjet. Minimizo mbetjet.", "Optimize cuts. Minimize waste."), Icon: CutIcon },
        { href: "#asistenti", label: "ECONERA Voice", desc: t("Kërko dhe lundro me zë.", "Search and navigate by voice."), Icon: VoiceIcon, voice: true },
      ],
    },
    {
      id: "nav-business", label: t("Për bizneset", "For Business"), href: undefined, match: ["/biznes", "/furnitore", "/cmimet"],
      items: [
        { href: "/biznes", label: t("Kompani ndërtimi", "Construction Companies"), desc: t("Stoku, kantieret dhe porositë në një vend.", "Stock, sites and orders in one place."), Icon: BuildingIcon },
        { href: "/furnitore", label: t("Furnitorë dhe prodhues", "Suppliers & Manufacturers"), desc: t("Shit stokun e tepërt te blerës të rinj.", "Sell surplus stock to new buyers."), Icon: FactoryIcon },
        { href: "/biznes#per-kend", label: t("Arkitektë dhe dizajnerë", "Architects & Designers"), desc: t("Koncepte me materiale që ekzistojnë realisht.", "Concepts built from materials that exist."), Icon: CompassIcon },
        { href: "/cmimet", label: t("Planet dhe çmimet", "Plans & Pricing"), desc: t("Abonime për furnitorët, falas për blerësit.", "Supplier plans, free for buyers."), Icon: PriceIcon },
      ],
    },
  ];
  const links = [
    { href: "/partneret", label: t("Partnerët", "Our Partners") },
    { href: "/rreth-nesh", label: t("Rreth nesh", "About Us") },
    { href: "/kontakt", label: t("Kontakt", "Contact") },
  ];
  return { groups, links };
}

const ACTIVE = "bg-[#dff5a8] text-[#0c2f2b] dark:bg-lime/15 dark:text-lime dark:ring-1 dark:ring-lime/35";
const Chevron = ({ open, size = 10 }: { open: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={`transition duration-200 ${open ? "rotate-180" : ""}`}><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
);

/**
 * `overlay` keeps the header transparent over the homepage hero until the visitor scrolls past it.
 */
export function SiteHeader({ account, overlay = false }: { account: Account; overlay?: boolean }) {
  const pathname = usePathname();
  const { t } = useLang();
  const { groups, links } = useNav();
  const [mobileOn, setMobileOn] = useState<string | null>(null);
  const mobile = mobileOn === pathname;
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(!overlay);
  const accRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 8); if (overlay) setPastHero(window.scrollY > window.innerHeight - 90); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);
  useEffect(() => {
    if (!accountOpen && !mobile) return;
    const down = (e: PointerEvent) => { if (accountOpen && !accRef.current?.contains(e.target as Node)) setAccountOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setAccountOpen(false); setMobileOn(null); } };
    window.addEventListener("pointerdown", down); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", down); window.removeEventListener("keydown", key); };
  }, [accountOpen, mobile]);

  const onHero = overlay && !pastHero && !mobile;
  const active = (href: string) => pathname.startsWith(href);
  const accountLinks = [
    ["/paneli", t("Paneli", "Dashboard")], ["/projektet", t("Projektet e mia", "My projects")], ["/ruajtura", t("Të ruajturat", "Saved materials")],
    ["/inventari/ofertat", t("Porositë dhe ofertat", "Orders and quotes")], ["/njoftimet", t("Njoftimet", "Notifications")], ["/mbrojtja", t("Mesazhet dhe ankesat", "Messages and complaints")],
    ["/inventari", t("Listimet e mia", "My listings")], ["/verifikimi", t("Verifikimi i llogarisë", "Account verification")],
  ];
  const close = () => setMobileOn(null);

  return (
    <header className={`${overlay ? "fixed inset-x-0" : "sticky"} top-0 z-40 px-3 pt-3 transition-[padding] sm:px-5 ${overlay || pathname === "/treg" ? "theme-dark" : ""} ${onHero ? "!bg-transparent" : ""}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border pr-2 pl-5 transition-all duration-300 sm:pl-6 ${scrolled && !onHero ? "h-14" : "h-16"} ${onHero ? "border-transparent bg-transparent" : scrolled ? "border-line bg-card/85 shadow-[0_10px_30px_-18px_rgba(12,47,43,0.35)] backdrop-blur-xl" : "border-line/70 bg-card/60 backdrop-blur-md"}`}>
        <Link href="/" aria-label={t("ECONERA, kreu", "ECONERA, home")} className="flex shrink-0 items-center">
          <Image src="/brand/logo-light.svg" alt="" width={481} height={66} priority className="h-6 w-auto dark:hidden" />
          <Image src="/brand/logo-dark.svg" alt="" width={481} height={66} priority className="hidden h-6 w-auto dark:block" />
        </Link>

        <nav aria-label={t("Navigimi kryesor", "Main navigation")} className="hidden items-center gap-0.5 xl:flex">
          {groups.map((g) => <NavDrop key={g.id} group={g} active={g.match.some(active)} />)}
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors ${active(l.href) ? ACTIVE : "text-ink-2 hover:text-ink"}`}>{l.label}</Link>
          ))}
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
          <button type="button" className="ml-1 grid size-10 place-items-center rounded-full border border-line text-ink xl:hidden" aria-expanded={mobile} aria-controls="menu-celular"
            aria-label={mobile ? t("Mbyll menunë", "Close menu") : t("Hap menunë", "Open menu")} onClick={() => setMobileOn(mobile ? null : pathname)}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">{mobile ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 5h14M2 9h14M2 13h14" />}</svg>
          </button>
        </div>
      </div>

      <nav id="menu-celular" aria-label={t("Menuja", "Menu")} hidden={!mobile} className="mx-auto mt-2 max-h-[calc(100dvh-6rem)] max-w-7xl overflow-y-auto rounded-card border border-line bg-card/95 p-3 text-ink shadow-xl backdrop-blur-xl xl:hidden">
        <ul className="grid gap-1">
          {groups.map((g) => <li key={g.id}><MobileGroup group={g} onPick={close} /></li>)}
          {links.map((l) => (
            <li key={l.href}><Link href={l.href} onClick={close} aria-current={active(l.href) ? "page" : undefined} className={`flex min-h-12 items-center rounded-xl px-3 text-base font-medium ${active(l.href) ? "text-lime" : "hover:bg-bg-2"}`}>{l.label}</Link></li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <ThemeToggle />
          {account ? <Link href="/paneli" className="btn-ghost">{t("Llogaria ime", "My account")}</Link> : <span className="flex gap-2"><Link href="/hyr" className="btn-ghost">{t("Hyr", "Log in")}</Link><Link href="/regjistrohu" className="btn-primary">{t("Regjistrohu", "Sign up")}</Link></span>}
        </div>
      </nav>
    </header>
  );
}

/** Compact dropdown: opens on hover or click, closes on Escape or outside click. With `href`, the label is a link and only the chevron toggles. */
function NavDrop({ group, active }: { group: Group; active: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hover = (v: boolean) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(v), v ? 80 : 180); };
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", down); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", down); window.removeEventListener("keydown", key); };
  }, [open]);
  const tone = active ? ACTIVE : open ? "text-ink" : "text-ink-2 hover:text-ink";

  return (
    <div ref={ref} className="relative" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      {group.href ? (
        <span className={`flex items-center rounded-full transition-colors ${tone}`}>
          <Link href={group.href} onClick={() => setOpen(false)} className="whitespace-nowrap rounded-l-full py-2 pr-1 pl-3 text-[13.5px] font-medium">{group.label}</Link>
          <button type="button" aria-expanded={open} aria-controls={group.id} aria-label={t(`Opsionet: ${group.label}`, `${group.label} options`)} onClick={() => setOpen((v) => !v)} className="grid h-9 place-items-center rounded-r-full pr-2.5 pl-1"><Chevron open={open} /></button>
        </span>
      ) : (
        <button type="button" aria-expanded={open} aria-controls={group.id} onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors ${tone}`}>
          {group.label}<Chevron open={open} />
        </button>
      )}
      <div id={group.id} inert={!open} className={`absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3 transition duration-200 ease-out ${group.wide ? "w-[min(600px,calc(100vw-2rem))]" : "w-80"} ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
        <div className="overflow-hidden rounded-2xl border border-line bg-card text-ink shadow-[0_24px_60px_-24px_rgba(6,34,30,0.45)]">
          <ul className={`grid gap-0.5 p-2 ${group.wide ? "grid-cols-2" : ""}`}>
            {group.items.map((i) => (
              <li key={i.href + i.label}>
                <Link href={i.href} data-open-assistant={i.voice ? "voice" : undefined} onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl p-2.5 outline-none transition-colors hover:bg-bg-2 focus-visible:bg-bg-2 focus-visible:ring-2 focus-visible:ring-lime">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-bg-2 text-lime transition-colors group-hover:border-lime/50"><i.Icon className="size-[18px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold tracking-tight">{i.label}</span>
                    <span className="block text-[12.5px] leading-snug text-ink-2">{i.desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {group.more && (
            <Link href={group.more.href} onClick={() => setOpen(false)} className="group flex items-center justify-between border-t border-line px-4 py-3 text-sm font-semibold text-lime outline-none transition-colors hover:bg-bg-2 focus-visible:bg-bg-2">
              {group.more.label}<ArrowIcon className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Drawer accordion for a nav group; the group's own page (if any) is the first row. */
function MobileGroup({ group, onPick }: { group: Group; onPick: () => void }) {
  const [open, setOpen] = useState(false);
  const panel = `${group.id}-m`;
  return (
    <>
      <button type="button" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}
        className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-3 text-left text-base font-medium transition-colors ${open ? "bg-bg-2 text-lime" : "hover:bg-bg-2"}`}>
        {group.label}<span className="ml-auto"><Chevron open={open} size={12} /></span>
      </button>
      <div id={panel} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={!open}>
          <ul className="grid gap-0.5 py-1.5 pl-2">
            {group.items.map((i) => (
              <li key={i.href + i.label}>
                <Link href={i.href} data-open-assistant={i.voice ? "voice" : undefined} onClick={onPick} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 hover:bg-bg-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-bg-2 text-lime"><i.Icon /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{i.label}</span><span className="block text-[13px] text-ink-2">{i.desc}</span></span>
                </Link>
              </li>
            ))}
            {group.more && <li><Link href={group.more.href} onClick={onPick} className="flex min-h-12 items-center px-2 text-sm font-semibold text-lime">{group.more.label} <span aria-hidden className="ml-1">→</span></Link></li>}
          </ul>
        </div>
      </div>
    </>
  );
}
