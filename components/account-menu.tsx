"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ACCOUNT_LINKS } from "@/lib/lang";
import { useLang } from "./lang-provider";

/** "Hyr" button with a dropdown: log in or sign up, as buyer or supplier. */
export function AccountMenu({ className = "", short = false }: { className?: string; short?: boolean }) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)} className="btn-ghost h-11 gap-2 whitespace-nowrap bg-bg/60 backdrop-blur">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="8" cy="5.5" r="2.75" /><path d="M2.5 14c.8-2.6 2.9-4 5.5-4s4.7 1.4 5.5 4" strokeLinecap="round" /></svg>
        {short ? t("Hyr", "Log in") : t("Hyr / Regjistrohu", "Log in / Sign up")}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={open ? "rotate-180" : ""}><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <div role="menu" className="xp-fade-in absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-card border border-line bg-bg/95 p-2 shadow-2xl backdrop-blur-md">
          {ACCOUNT_LINKS.map((g) => (
            <div key={g.group.sq} className="p-1">
              <p className="px-3 pt-2 pb-1 text-xs font-medium text-ink-2">{g.group[lang]}</p>
              {g.items.map((i) => (
                <Link key={i.href} role="menuitem" href={i.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-card">{i[lang]}</Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
