"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { cart, type CartItem } from "@/lib/cart";

/** One-tap Add to cart from a card; once added, offers Go to cart. Sits above the card's full-size link. */
export function QuickAdd({ item }: { item: Omit<CartItem, "quantity"> }) {
  const { t } = useLang();
  const [added, setAdded] = useState(false);
  return (
    <div className="relative z-10 mt-3 grid gap-2" aria-live="polite">
      {added ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Link href="/shporta" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-bg transition hover:opacity-90">
            {t("Shko te shporta", "Go to cart")} <span aria-hidden>→</span>
          </Link>
          <button type="button" onClick={() => cart.add({ ...item, quantity: 1 })} aria-label={t("Shto edhe një", "Add one more")} className="grid size-10 place-items-center rounded-full border border-line text-lg hover:border-lime">+</button>
        </div>
      ) : (
        <button type="button" onClick={() => { cart.add({ ...item, quantity: 1 }); setAdded(true); }}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-lime text-sm font-semibold text-bg transition hover:bg-lime-dim">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M2.5 3.5h2l1.8 9h9l1.7-6.5H5.4" strokeLinejoin="round" /><circle cx="8" cy="16" r="1.2" /><circle cx="14.5" cy="16" r="1.2" /></svg>
          {t("Shto në shportë", "Add to cart")}
        </button>
      )}
      {added && <p className="text-center text-[11px] text-lime-dim">{item.demo ? t("U shtua · shembull demo", "Added · demo example") : t("U shtua në shportë", "Added to cart")}</p>}
    </div>
  );
}
