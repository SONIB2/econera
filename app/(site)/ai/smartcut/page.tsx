import type { Metadata } from "next";
import { SmartCut } from "@/components/tools/smartcut";
import { ToolHeader } from "@/components/tools/tool-header";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { loadInventory } from "@/lib/tools/inventory-server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: "SmartCut", description: tr(lang, "Prerje e optimizuar nga copëzat e tregut: më pak fletë të reja, më pak mbetje.", "Optimised cutting from market offcuts: fewer new sheets, less waste.") };
}

export default async function SmartCutPage() {
  const lang = await getLang();
  const inventory = await loadInventory();
  const sheets = inventory.listings.filter((l) => l.sheet);
  return (
    <>
      <ToolHeader hub="AI Tools" name="SmartCut" title={tr(lang, "Prit pjesët nga copëzat, jo nga fletë të reja.", "Cut your pieces from offcuts, not new sheets.")}
        lead={tr(lang, "Shkruaj pjesët që të duhen. SmartCut gjen copëzat e tregut që i mbajnë, llogarit skemën e prerjes dhe sa kursen.", "Enter the pieces you need. SmartCut finds market offcuts that fit them, draws the cutting layout and shows the saving.")}
        note={tr(lang, "Llogaritja është gjeometrike dhe e përcaktuar (MaxRects), me trashësinë e sharrës, rrotullimin, fibrën dhe defektet.", "The calculation is deterministic geometry (MaxRects) with blade width, rotation, grain and defects.")} />
      <div className="container-x pb-20"><SmartCut listings={sheets} /></div>
    </>
  );
}
