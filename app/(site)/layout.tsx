import { AiDock } from "@/components/site/ai-dock";
import { BottomNav } from "@/components/site/bottom-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Assistant } from "@/components/tools/assistant";
import { headerAccount } from "@/lib/account";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import "./site.css";

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [account, lang] = await Promise.all([headerAccount(), getLang()]);
  return (
    <>
      <a href="#permbajtja" className="sr-only z-50 rounded-full bg-lime px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3">{tr(lang, "Kalo te përmbajtja", "Skip to content")}</a>
      <SiteHeader account={account} />
      <main id="permbajtja" tabIndex={-1}>{children}</main>
      <SiteFooter email={process.env.PILOT_CONTACT_EMAIL} />
      <AiDock />
      <Assistant />
      <BottomNav />
    </>
  );
}
