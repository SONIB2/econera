import Image from "next/image";
import Link from "next/link";
import { ctaNav, siteNav } from "./nav";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm space-y-4">
          <Image src="/brand/logo-dark.svg" alt="ECONERA" width={481} height={66} className="h-6 w-auto" />
          <p className="text-sm leading-relaxed text-ink-2">Tregu online ku materialet e tepërta të ndërtimit gjejnë projektin e radhës, me AI.</p>
          <p className="text-xs text-ink-2">Tiranë · Aplikim për Startup Albania, Faza 1</p>
        </div>
        <nav aria-label="Faqet">
          <p className="eyebrow mb-4">Platforma</p>
          <ul className="space-y-2.5 text-sm">
            {siteNav.map((item) => <li key={item.href}><Link className="text-ink-2 hover:text-ink" href={item.href}>{item.label}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Kontakt dhe ligjore">
          <p className="eyebrow mb-4">ECONERA</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="text-ink-2 hover:text-ink" href={ctaNav.href}>{ctaNav.label}</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/privatesia">Privatësia</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/aksesueshmeria">Aksesueshmëria</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container-x flex flex-col gap-2 border-t border-line py-6 text-xs text-ink-2 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} ECONERA · Sonila Balla & Rey Sylaj</p>
        <p>Stoku, çmimet dhe furnitorët në këtë version janë të dhëna demonstruese.</p>
      </div>
    </footer>
  );
}
