"use client";

import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { cart, type CartItem } from "@/lib/cart";

/** One-tap add of one unit to the cart from a product card; sits above the card's full-size link. */
export function QuickAdd({ item }: { item: Omit<CartItem, "quantity"> }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => { cart.add({ ...item, quantity: 1 }); setDone(true); setTimeout(() => setDone(false), 1800); }}
      className="relative z-10 mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-lime text-sm font-semibold text-bg transition hover:bg-lime-dim" aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M2.5 3.5h2l1.8 9h9l1.7-6.5H5.4" strokeLinejoin="round" /><circle cx="8" cy="16" r="1.2" /><circle cx="14.5" cy="16" r="1.2" /></svg>
      {done ? t("U shtua", "Added") : t("Shto në shportë", "Add to cart")}
    </button>
  );
}
