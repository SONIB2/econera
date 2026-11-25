"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { cart } from "@/lib/cart";
import { formatNumber } from "@/lib/format";
import { handoff } from "@/lib/tools/projects";

type P = { id: string; title: string; unit: string; unitPrice: number; currency: "ALL" | "EUR"; priceLek: number; quantity: number; seller: string; city: string; toolCategory: string; sheet: boolean; demo?: boolean; fulfillment: string };

/** Purchase summary: quantity, cart (sent as quote requests), quote, Smart Basket, SmartCut, AI Renovation, share. */
export function ProductActions({ p }: { p: P }) {
  const { t } = useLang();
  const router = useRouter();
  const [qty, setQty] = useState(Math.min(1, p.quantity) || 1);
  const [note, setNote] = useState<string | null>(null);
  const total = qty * p.unitPrice;
  const money = (n: number) => (p.currency === "EUR" ? `€${formatNumber(n, 2)}` : `${formatNumber(n, 0)} L`);
  function addToCart() {
    cart.add({ id: p.id, title: p.title, unit: p.unit, priceLek: p.priceLek, quantity: qty, max: p.quantity, seller: p.seller, city: p.city });
    setNote(t("U shtua në shportë.", "Added to cart."));
  }
  function toBasket() {
    handoff.putItems([{ text: p.title, category: p.toolCategory, quantity: qty, unit: p.unit, listingId: `live:${p.id}` }]);
    router.push("/ai/shporta");
  }
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else { await navigator.clipboard.writeText(url); setNote(t("Lidhja u kopjua.", "Link copied.")); }
    } catch { /* cancelled */ }
  }
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{t("Sasia", "Quantity")} ({p.unit})</span>
        <div className="flex items-center rounded-full border border-line">
          <button type="button" aria-label={t("Pakëso", "Decrease")} onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-10 place-items-center text-lg">−</button>
          <input aria-label={t("Sasia", "Quantity")} type="number" min={1} max={p.quantity} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(p.quantity, Number(e.target.value) || 1)))} className="w-16 bg-transparent text-center tabular-nums outline-none" />
          <button type="button" aria-label={t("Shto", "Increase")} onClick={() => setQty((q) => Math.min(p.quantity, q + 1))} className="grid size-10 place-items-center text-lg">+</button>
        </div>
      </div>
      <p className="flex justify-between text-sm"><span className="text-ink-2">{t("Vlera e vlerësuar", "Estimated value")}</span><span className="font-semibold tabular-nums">{money(total)}</span></p>
      {p.demo ? (
        <p className="rounded-xl bg-bg-2 px-4 py-3 text-sm">{t("Ky është një shembull demonstrues dhe nuk mund të blihet.", "This is a demo example and cannot be bought.")}</p>
      ) : (
        <>
          <button type="button" onClick={addToCart} className="btn-primary h-12 text-base">{t(`Shto në shportë · ${money(total)}`, `Add to cart · ${money(total)}`)}</button>
          <Link href={`/materiale/${p.id}/oferte`} className="btn-ghost">{t("Kërko ofertë nga shitësi", "Request a quote")}</Link>
        </>
      )}
      <button type="button" onClick={toBasket} disabled={p.demo} className="btn-ghost disabled:opacity-50">{t("Shto në Smart Basket", "Add to Smart Basket")}</button>
      <div className="grid grid-cols-2 gap-2">
        {p.sheet && <Link href="/ai/smartcut" className="rounded-xl border border-line px-3 py-2.5 text-center text-sm hover:border-lime">{t("Optimizo me SmartCut", "Optimize with SmartCut")}</Link>}
        <Link href="/ai/renovim" className="rounded-xl border border-line px-3 py-2.5 text-center text-sm hover:border-lime">{t("Vizualizo në AI Renovation", "Visualize in AI Renovation")}</Link>
        <button type="button" onClick={share} className="rounded-xl border border-line px-3 py-2.5 text-sm hover:border-lime">{t("Shpërndaj", "Share")}</button>
      </div>
      {note && <p role="status" className="text-sm text-lime">{note} {note.includes("shport") || note.includes("cart") ? <Link href="/shporta" className="underline">{t("Hap shportën", "Open cart")}</Link> : null}</p>}
      <p className="text-xs text-ink-2">{t("Pagesa online nuk është aktive ende: shporta dërgon kërkesa për ofertë te shitësit dhe çmimi konfirmohet prej tyre.", "Online payment is not active yet: the cart sends quote requests to sellers, who confirm the price.")}</p>
    </div>
  );
}
