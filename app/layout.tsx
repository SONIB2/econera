import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import { ErrorReporter } from "@/components/error-reporter";
import { LangProvider } from "@/components/lang-provider";
import { LANG_COOKIE } from "@/lib/lang";
import { applicationOrigin, isPreview } from "@/lib/deployment";

const inter = localFont({ src: "../node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2", variable: "--font-inter", weight: "100 900", display: "swap", adjustFontFallback: "Arial" });
const sora = localFont({ src: "../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2", variable: "--font-sora", weight: "100 800", display: "swap", adjustFontFallback: "Arial" });

export async function generateMetadata(): Promise<Metadata> {
  const origin = applicationOrigin();
  const sq = (await cookies()).get(LANG_COOKIE)?.value === "sq";
  const title = sq ? "ECONERA | Mos i hidh materialet. Ndërto mundësi." : "ECONERA | Don't waste materials. Build possibilities.";
  const description = sq ? "Gjej, ripërdor dhe transformo materiale ndërtimi me mjete inteligjente që kursejnë para dhe ulin mbetjet." : "Discover, reuse and transform construction materials with intelligent tools that save money and reduce waste.";
  return {
    metadataBase: origin ? new URL(origin) : undefined,
    title: { default: title, template: "%s | ECONERA" },
    description,
    applicationName: "ECONERA",
    icons: { icon: "/brand/icon.svg", apple: "/brand/icon-180.png" },
    openGraph: { siteName: "ECONERA", title, description, locale: sq ? "sq_AL" : "en_GB", images: [{ url: "/brand/social.png", width: 1200, height: 630, alt: "ECONERA, Construction Intelligence" }] },
    twitter: { card: "summary_large_image", images: ["/brand/social.png"] },
    robots: isPreview() ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f8f5" }, { media: "(prefers-color-scheme: dark)", color: "#062723" }], colorScheme: "light dark" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  // A language in the URL (?lang=, /sq/, /en/) wins over the saved choice; new visitors get English.
  const locale = ((await headers()).get("x-econera-locale") || chosen || "en") === "sq" ? "sq" : "en";
  return (
    <html lang={locale} className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved or system theme before paint, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("econera.theme");if(t==="dark"||(!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body><LangProvider lang={locale}>{children}</LangProvider><ErrorReporter /></body>
    </html>
  );
}
