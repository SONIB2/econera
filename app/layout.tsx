import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Brand } from "@/components/brand";
import { showcaseCopy } from "@/lib/showcase";
import { applicationOrigin } from "@/lib/supabase";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";

export function generateMetadata(): Metadata {
  const origin = applicationOrigin();
  const title = "ECONERA | Construction Intelligence";
  return {
    metadataBase: origin ? new URL(origin) : undefined,
    title: { default: title, template: "%s | ECONERA" },
    description: "Zbulo, menaxho dhe nxirr në treg materiale ndërtimi të tepërta ose të ripërdorshme në Shqipëri.",
    applicationName: "ECONERA",
    icons: { icon: "/brand/icon.svg", apple: "/brand/icon-180.png" },
    openGraph: { siteName: "ECONERA", title, images: [{ url: "/brand/social.png", width: 1200, height: 630, alt: "ECONERA Construction Intelligence" }] },
    twitter: { card: "summary_large_image", images: ["/brand/social.png"] },
    robots: process.env.ECONERA_PREVIEW === "1" ? { index: false, follow: false } : undefined,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await headers()).get("x-econera-locale") === "en" ? "en" : "sq";
  const copy = showcaseCopy[locale].shell;
  const brand = locale === "en" ? { href: "/en/platform", label: copy.home } : {};
  return (
    <html lang={locale}>
      <body>
        <a className="skip" href="#permbajtja">{copy.skip}</a>
        <header className="site-header">
          <div className="container header-inner">
            <Brand {...brand} />
            <nav aria-label={copy.nav}>
              {/* Full document navigation refreshes the root language across locale boundaries. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/?scene=house" hrefLang="sq">{locale === "en" ? `${copy.world} (SQ)` : "Eksploruesi"}</a>
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
      </body>
    </html>
  );
}
