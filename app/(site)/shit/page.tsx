import type { Metadata } from "next";
import Link from "next/link";
import { SellWizard } from "@/components/market/sell-wizard";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { sessionDatabase } from "@/lib/supabase";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Shit materiale", "Sell materials"), description: tr(lang, "Listo materialet e tepërta, të rikuperuara ose copat. Çdo listim shqyrtohet nga ECONERA.", "List surplus, reclaimed or offcut materials. Every listing is reviewed by ECONERA.") };
}

export default async function Sell() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const db = await sessionDatabase();
  const user = db ? (await db.auth.getUser()).data.user : null;
  return (
    <div className="container-x pt-10 pb-20">
      <h1 className="display max-w-3xl text-4xl md:text-6xl">{t("Teprica jote është projekti i dikujt tjetër.", "Your surplus is someone else's next project.")}</h1>
      <p className="mt-4 max-w-2xl text-ink-2">{t("Gjashtë hapa të shkurtër. Listimi publikohet vetëm pasi e shqyrton një person nga ECONERA.", "Six short steps. Your listing goes live only after a person at ECONERA reviews it.")}</p>
      {!user && <p className="mt-6 rounded-xl border border-line bg-card px-4 py-3 text-sm">{t("Për të ruajtur listimin duhet llogari.", "You need an account to save a listing.")} <Link href="/hyr" className="font-medium underline">{t("Hyr", "Log in")}</Link> · <Link href="/regjistrohu?lloji=furnitor" className="font-medium underline">{t("Krijo llogari shitësi", "Create a seller account")}</Link></p>}
      <div className="mt-8"><SellWizard /></div>
    </div>
  );
}
