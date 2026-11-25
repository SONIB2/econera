import type { Metadata } from "next";
import { SmartBasket } from "@/components/tools/smart-basket";
import { ToolHeader } from "@/components/tools/tool-header";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { loadInventory } from "@/lib/tools/inventory-server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: "Smart Basket", description: tr(lang, "Kombinimi më i mirë i materialeve nga disa shitës, brenda buxhetit.", "The best combination of materials from several sellers, within budget.") };
}

export default async function SmartBasketPage() {
  const lang = await getLang();
  const inventory = await loadInventory();
  return (
    <>
      <ToolHeader hub="AI Tools" name="Smart Basket" title={tr(lang, "Një listë. Tre mënyra për ta blerë.", "One list. Three ways to buy it.")}
        lead={tr(lang, "Shkruaj ose thuaj çfarë të duhet. Smart Basket kërkon në stokun e tregut dhe ndërton planin më të lirë, më ekologjik dhe të balancuar, me transportin përfshirë.", "Write or say what you need. Smart Basket searches market stock and builds the cheapest, greenest and balanced plan, transport included.")} />
      <div className="container-x pb-20"><SmartBasket listings={inventory.listings} live={inventory.live} connected={inventory.connected} /></div>
    </>
  );
}
