import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { LangProvider } from "@/components/lang-provider";
import { LANG_COOKIE } from "@/lib/lang";
import { applicationOrigin, isPreview } from "@/lib/deployment";

export function generateMetadata(): Metadata {
  const origin = applicationOrigin();
  const title = "ECONERA | Ndërtimi takon inteligjencën";
  const description = "Tregu online ku materialet e tepërta të ndërtimit gjejnë projektin e radhës, me AI.";
  return {
    metadataBase: origin ? new URL(origin) : undefined,
    title: { default: title, template: "%s | ECONERA" },
    description,
    applicationName: "ECONERA",
    icons: { icon: "/brand/icon.svg", apple: "/brand/icon-180.png" },
    openGraph: { siteName: "ECONERA", title, description, locale: "sq_AL", images: [{ url: "/brand/social.png", width: 1200, height: 630, alt: "ECONERA, Construction Intelligence" }] },
    twitter: { card: "summary_large_image", images: ["/brand/social.png"] },
    robots: isPreview() ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#f4f8f5", colorScheme: "light" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  const locale = (chosen ?? (await headers()).get("x-econera-locale")) === "en" ? "en" : "sq";
  return (
    <html lang={locale}>
      <body><LangProvider lang={locale}>{children}</LangProvider></body>
    </html>
  );
}
