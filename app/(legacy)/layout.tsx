import Link from "next/link";
import { headers } from "next/headers";
import { Brand } from "@/components/brand";
import { showcaseCopy } from "@/lib/showcase";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";

/** Shell for the original application routes (accounts, inventory, moderation, catalogue). URLs are unchanged. */
export default async function LegacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await headers()).get("x-econera-locale") === "en" ? "en" : "sq";
  const copy = showcaseCopy[locale].shell;
  const brand = locale === "en" ? { href: "/en/platform", label: copy.home } : {};
  return (
    <>
      <a className="skip" href="#permbajtja">{copy.skip}</a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand {...brand} />
          <nav aria-label={copy.nav}>
            {/* Full document navigation refreshes the root language across locale boundaries. */}
            <a href="/bota?scene=house" hrefLang="sq">{locale === "en" ? `${copy.world} (SQ)` : "Eksploruesi"}</a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/materiale" hrefLang="sq">{locale === "en" ? `${copy.catalogue} (SQ)` : copy.catalogue}</a>
            <a href={`/${locale}/platform`}>{copy.demo}</a>
            {locale === "sq" && <Link href="/inventari">Inventari</Link>}
          </nav>
          <a href="/hyr" className="button small">{locale === "en" ? `${copy.signin} (SQ)` : copy.signin}</a>
        </div>
      </header>
      <main id="permbajtja" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div><Brand {...brand} /><p>{copy.mission}</p></div>
          <nav aria-label={copy.footer}>
            <a href="/aksesueshmeria">{locale === "en" ? `${copy.a11y} (SQ)` : copy.a11y}</a>
            {locale === "sq" && <Link href="/regjistrohu">Regjistrohu</Link>}
          </nav>
        </div>
      </footer>
    </>
  );
}
