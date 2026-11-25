"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ctaNav, loginNav, siteNav } from "./nav";

export function SiteHeader() {
  const pathname = usePathname();
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
        <Link href="/" aria-label="ECONERA, kryefaqja" className="flex shrink-0 items-center">
          <Image src="/brand/logo-dark.svg" alt="" width={481} height={66} priority className="h-6 w-auto" />
        </Link>

        <nav aria-label="Navigimi kryesor" className="hidden items-center gap-1 lg:flex">
          {siteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${isActive(item.href) ? "text-lime" : "text-ink-2 hover:text-ink"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={loginNav.href} className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-ink hover:text-lime sm:inline-flex">{loginNav.label}</Link>
          <Link href={ctaNav.href} className="btn-primary hidden sm:inline-flex">{ctaNav.label}</Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="menu-celular"
            aria-label={open ? "Mbyll menunë" : "Hap menunë"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
            </svg>
          </button>
        </div>
      </div>

      <nav id="menu-celular" aria-label="Menuja" hidden={!open} className="container-x border-t border-line pb-6 lg:hidden">
        <ul className="grid gap-1 pt-3">
          {siteNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`block rounded-xl px-3 py-3 text-base font-medium ${isActive(item.href) ? "bg-card text-lime" : "text-ink"}`}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={loginNav.href} className="btn-ghost w-full">{loginNav.label}</Link>
          <Link href={ctaNav.href} className="btn-primary w-full">{ctaNav.label}</Link>
        </div>
      </nav>
    </header>
  );
}
