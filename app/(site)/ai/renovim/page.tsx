import type { Metadata } from "next";
import { Renovation } from "@/components/tools/renovation";
import { ToolHeader } from "@/components/tools/tool-header";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { loadInventory } from "@/lib/tools/inventory-server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: "AI Renovation", description: tr(lang, "Nga foto e dhomës te lista e materialeve dhe ofertat reale në treg.", "From a room photo to a material list and real market offers.") };
}

export default async function RenovationPage() {
  const lang = await getLang();
  const inventory = await loadInventory();
  return (
    <>
      <ToolHeader hub="AI Tools" name="AI Renovation" title={tr(lang, "Nga mbetja te dizajni.", "From waste to design.")}
        lead={tr(lang, "Fotografo hapësirën, zgjidh stilin dhe buxhetin. ECONERA llogarit materialet dhe i gjen në tregun e materialeve të ripërdorura.", "Photograph the space, choose a style and budget. ECONERA estimates the materials and finds them on the reuse market.")} />
      <div className="container-x pb-20"><Renovation listings={inventory.listings.filter((l) => !l.sheet)} live={inventory.live} connected={inventory.connected} /></div>
    </>
  );
}
