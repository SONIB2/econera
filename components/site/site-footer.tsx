"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/lang-provider";
import { NAV } from "@/lib/lang";

export function SiteFooter() {
  const { lang, t } = useLang();
  return (
    <footer className="theme-dark border-t border-line">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm space-y-4">
          <Image src="/brand/logo-dark.svg" alt="ECONERA" width={481} height={66} className="h-6 w-auto" />
          <p className="text-sm leading-relaxed text-ink-2">{t("Tregu online ku materialet e tepërta të ndërtimit gjejnë projektin e radhës, me AI.", "The online market where surplus construction materials find their next project, with AI.")}</p>
          <p className="text-xs text-ink-2">{t("Tiranë · Aplikim për Startup Albania, Faza 1", "Tirana · Startup Albania application, Phase 1")}</p>
        </div>
        <nav aria-label={t("Faqet", "Pages")}>
          <p className="eyebrow mb-4">{t("Platforma", "Platform")}</p>
          <ul className="space-y-2.5 text-sm">
            {NAV.map((item) => <li key={item.href}><Link className="text-ink-2 hover:text-ink" href={item.href}>{item[lang]}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label={t("Kontakt dhe ligjore", "Contact and legal")}>
          <p className="eyebrow mb-4">ECONERA</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="text-ink-2 hover:text-ink" href="/regjistrohu">{t("Regjistrohu falas", "Sign up free")}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/hyr">{t("Hyr", "Log in")}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/kontakt">{t("Kontakt", "Contact")}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/verifikimi">{t("Verifiko llogarinë", "Verify your account")}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/mbrojtja">{t("Mbrojtja e klientit", "Customer protection")}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/njoftimet">{t("Njoftimet", "Notifications")}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/privatesia">{t("Privatësia", "Privacy")}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/aksesueshmeria">{t("Aksesueshmëria", "Accessibility")}</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container-x flex flex-col gap-2 border-t border-line py-6 text-xs text-ink-2 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} ECONERA · Sonila Balla & Rey Sylaj</p>
        <p>{t("Stoku, çmimet dhe furnitorët në këtë version janë të dhëna demonstruese.", "Stock, prices and suppliers in this version are demo data.")}</p>
      </div>
    </footer>
  );
}
