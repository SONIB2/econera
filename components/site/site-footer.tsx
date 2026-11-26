"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/lang-provider";

/**
 * Global footer. Every link points to a page that exists; contact details come from configuration
 * (PILOT_CONTACT_EMAIL) and are omitted when not set. No social profiles are linked until official ones exist.
 */
export function SiteFooter({ email }: { email?: string }) {
  const { t } = useLang();
  const cols: { title: string; links: [string, string][] }[] = [
    { title: t("Platforma", "Platform"), links: [["/treg", t("Tregu", "Marketplace")], ["/shit", t("Shit materiale", "Sell Materials")], ["/ai", t("Mjetet AI", "AI Tools")], ["/verifikimi", "ECONERA Verify"], ["/biznes", t("Për bizneset", "For Business")]] },
    { title: t("Burime", "Resources"), links: [["/ai", t("Si funksionon", "How it works")], ["/cmimet", t("Çmimet", "Pricing")], ["/kontakt", t("Mbështetje", "Support")], ["/mbrojtja", t("Qendra e ndihmës", "Help Center")]] },
    { title: t("Kompania", "Company"), links: [["/rreth-nesh", t("Rreth ECONERA", "About ECONERA")], ["/kontakt", t("Kontakt", "Contact")], ["/furnitore", t("Për furnitorët", "For suppliers")], ["/certifikata", t("Certifikata", "Certificate")]] },
  ];
  const head = "text-sm font-semibold text-[#c8f169]";
  const link = "text-sm text-white/70 transition hover:text-white";

  return (
    <footer className="theme-dark border-t border-white/10 bg-[#062321] text-ink">
      <div className="container-x grid gap-10 py-14 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.2fr]">
        <div className="max-w-xs lg:border-r lg:border-white/10 lg:pr-8">
          <Image src="/brand/logo-dark.svg" alt="ECONERA" width={481} height={66} className="h-7 w-auto" />
          <p className="mt-5 text-sm leading-relaxed text-white/75">{t("Platforma inteligjente për ndërtimin qarkullues. Bli, shit, dizajno dhe optimizo materialet me AI.", "The intelligent platform for circular construction. Buy, sell, design and optimize materials with AI.")}</p>
          {/* Only official profiles that exist. */}
          <ul className="mt-5 flex gap-3">
            <li><a href="https://www.instagram.com/econera.al/" target="_blank" rel="noopener noreferrer" aria-label="Instagram @econera.al" className="grid size-10 place-items-center rounded-full border border-white/15 text-white/85 transition hover:border-[#c8f169] hover:text-[#c8f169]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" /></svg>
            </a></li>
          </ul>
        </div>

        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            {/* Collapsible on mobile, always open from md up. */}
            <details className="group md:hidden">
              <summary className={`${head} flex cursor-pointer list-none items-center justify-between py-1 [&::-webkit-details-marker]:hidden`}>{c.title}<span aria-hidden className="text-white/50 transition group-open:rotate-45">+</span></summary>
              <ul className="mt-3 space-y-2.5">{c.links.map(([href, label]) => <li key={href + label}><Link className={link} href={href}>{label}</Link></li>)}</ul>
            </details>
            <div className="hidden md:block">
              <p className={head}>{c.title}</p>
              <ul className="mt-4 space-y-2.5">{c.links.map(([href, label]) => <li key={href + label}><Link className={link} href={href}>{label}</Link></li>)}</ul>
            </div>
          </nav>
        ))}

        <div>
          <p className={head}>{t("Na kontaktoni", "Contact us")}</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            {email && <li className="flex items-center gap-3"><Icon d="M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6" /><a className="hover:text-white" href={`mailto:${email}`}>{email}</a></li>}
            {!email && <li className="flex items-center gap-3"><Icon d="M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6" /><Link className="hover:text-white" href="/kontakt">{t("Formulari i kontaktit", "Contact form")}</Link></li>}
            <li className="flex items-center gap-3"><Icon d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z" />{t("Tiranë, Shqipëri", "Tirana, Albania")}</li>
            <li className="flex items-center gap-3"><Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z" /><a className="hover:text-white" href="https://www.econera.al">www.econera.al</a></li>
          </ul>
        </div>
      </div>
      <div className="container-x flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ECONERA. {t("Të gjitha të drejtat e rezervuara.", "All rights reserved.")}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li><Link className="hover:text-white" href="/privatesia">{t("Politika e privatësisë", "Privacy Policy")}</Link></li>
          <li><Link className="hover:text-white" href="/aksesueshmeria">{t("Aksesueshmëria", "Accessibility")}</Link></li>
          <li><Link className="hover:text-white" href="/mbrojtja">{t("Mbrojtja e klientit", "Customer protection")}</Link></li>
        </ul>
      </div>
    </footer>
  );
}

function Icon({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-white/80"><path d={d} /></svg>;
}
