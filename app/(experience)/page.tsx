import { cookies } from "next/headers";
import { Experience } from "@/components/experience/experience";
import { HomeSections } from "@/components/home/home-sections";
import { parseRegion, REGION_COOKIE } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { liveMarket } from "@/lib/market/live";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [lang, store, market] = await Promise.all([getLang(), cookies(), liveMarket()]);
  return (
    <>
      <Experience />
      <HomeSections lang={lang} region={parseRegion(store.get(REGION_COOKIE)?.value)} items={market.items} />
    </>
  );
}
