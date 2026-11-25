"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/lang-provider";

const ITEMS = [
  { href: "/", sq: "Kreu", en: "Home", d: "M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z" },
  { href: "/treg", sq: "Tregu", en: "Market", d: "M3.5 7.5h13l-1 9h-11zM7 7.5V6a3 3 0 0 1 6 0v1.5" },
  { href: "/shit", sq: "Shit", en: "Sell", d: "M10 4v12M4 10h12" },
  { href: "/ai", sq: "Mjetet AI", en: "AI Tools", d: "M10 2.5l1.6 4.4L16 8.5l-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6zM15.5 13l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" },
  { href: "/paneli", sq: "Profili", en: "Profile", d: "M10 10a3.25 3.25 0 1 0 0-6.5A3.25 3.25 0 0 0 10 10zM3.5 17c.9-3 3.4-4.5 6.5-4.5s5.6 1.5 6.5 4.5" },
];

/** Simplified bottom navigation on phones; secondary modules live in the AI Tools hub. */
export function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav data-bottom-nav aria-label={lang === "en" ? "Quick navigation" : "Navigim i shpejtë"} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={active(i.href) ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active(i.href) ? "text-lime" : "text-ink-2"}`}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden><path d={i.d} /></svg>
              {i[lang]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
