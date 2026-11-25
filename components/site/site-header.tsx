"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { LangToggle, useLang } from "@/components/lang-provider";
import { ACCOUNT_LINKS, NAV } from "@/lib/lang";

export function SiteHeader() {
  const pathname = usePathname();
  const { lang, t } = useLang();
  // The menu belongs to the page it was opened on, so navigating closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((current: boolean) => boolean)) =>
    setOpenOn((typeof value === "function" ? value(open) : value) ? pathname : null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${scrolled || open ? "border-line bg-bg/85 backdrop-blur-md" : "border-transparent bg-transparent"}`}>
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={t("ECONERA, kryefaqja", "ECONERA, home")} className="flex shrink-0 items-center">
          <Image src="/brand/logo-light.svg" alt="" width={481} height={66} priority className="h-6 w-auto" />
        </Link>

        <nav aria-label={t("Navigimi kryesor", "Main navigation")} className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${isActive(item.href) ? "text-lime" : "text-ink-2 hover:text-ink"}`}
            >
              {item[lang]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle />
          <AccountMenu short className="hidden md:block" />
          <Link href="/regjistrohu" className="btn-primary hidden whitespace-nowrap sm:inline-flex">{t("Regjistrohu falas", "Sign up free")}</Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink xl:hidden"
            aria-expanded={open}
            aria-controls="menu-celular"
            aria-label={open ? t("Mbyll menunë", "Close menu") : t("Hap menunë", "Open menu")}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
            </svg>
          </button>
        </div>
      </div>

      <nav id="menu-celular" aria-label={t("Menuja", "Menu")} hidden={!open} className="container-x border-t border-line pb-6 xl:hidden">
        <ul className="grid gap-1 pt-3">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`block rounded-xl px-3 py-3 text-base font-medium ${isActive(item.href) ? "bg-card text-lime" : "text-ink"}`}>
                {item[lang]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-4">
          {ACCOUNT_LINKS.map((g) => (
            <div key={g.group.sq}>
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.18em] text-lime uppercase">{g.group[lang]}</p>
              {g.items.map((i) => <Link key={i.href} href={i.href} className="block rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-card">{i[lang]}</Link>)}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}
