import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import "./site.css";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#permbajtja" className="sr-only z-50 rounded-full bg-lime px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Kalo te përmbajtja</a>
      <SiteHeader />
      <main id="permbajtja" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </>
  );
}
