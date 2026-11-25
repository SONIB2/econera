import type { Metadata } from "next";
import { CartView } from "@/components/market/cart-view";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default async function CartPage() {
  const lang = await getLang();
  return (
    <div className="container-x pt-10 pb-20">
      <h1 className="display text-4xl md:text-5xl">{tr(lang, "Shporta", "Cart")}</h1>
      <p className="mt-3 max-w-2xl text-ink-2">{tr(lang, "Materialet grupohen sipas shitësit. Dërgo kërkesat për ofertë njëherësh.", "Materials are grouped by seller. Send all quote requests at once.")}</p>
      <div className="mt-8"><CartView /></div>
    </div>
  );
}
