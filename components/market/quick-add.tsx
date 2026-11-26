"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { cart, type CartItem } from "@/lib/cart";

// Units sold by measure accept half steps; countable units (pieces, bags, pallets) whole numbers only.
const DECIMAL = new Set(["m²", "m", "m³", "kg", "ton", "sqm", "lm"]);

/** Quantity stepper + Add to cart on a product card. Bounded by the available stock; demo items stay labelled. */
export function QuickAdd({ item }: { item: Omit<CartItem, "quantity"> }) {
  const { t } = useLang();
  const step = DECIMAL.has(item.unit) ? 0.5 : 1;
  const min = step;
  const [qty, setQty] = useState(Math.min(1, item.max));
  const [added, setAdded] = useState(false);
  const clamp = (v: number) => Math.max(min, Math.min(item.max, Math.round(v / step) * step));
  const set = (v: number) => { setQty(clamp(v)); setAdded(false); };
  const btn = "grid size-8 place-items-center rounded-full text-ink-2 transition hover:bg-bg-2 hover:text-ink disabled:opacity-35";

  return (
    <div className="relative z-10 mt-3" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex h-10 flex-1 items-center justify-between rounded-full border border-line px-1" role="group" aria-label={t("Sasia", "Quantity")}>
          <button type="button" className={btn} onClick={() => set(qty - step)} disabled={qty <= min} aria-label={t("Pakëso", "Decrease")}>−</button>
          <input type="number" inputMode="decimal" min={min} max={item.max} step={step} value={qty} onChange={(e) => set(Number(e.target.value) || min)}
            aria-label={t(`Sasia në ${item.unit}`, `Quantity in ${item.unit}`)} className="w-10 bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
          <button type="button" className={btn} onClick={() => set(qty + step)} disabled={qty >= item.max} aria-label={t("Shto", "Increase")}>+</button>
        </div>
        <button type="button" onClick={() => { cart.add({ ...item, quantity: qty }); setAdded(true); }}
          aria-label={t(`Shto ${qty} ${item.unit} në shportë`, `Add ${qty} ${item.unit} to cart`)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#0f4a43] px-4 text-sm font-semibold text-white transition hover:bg-[#0c3a35] dark:bg-[#c8f169] dark:text-[#062321] dark:hover:bg-[#d6f68a]">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="M2.5 3.5h2l1.8 9h9l1.7-6.5H5.4" strokeLinejoin="round" /><circle cx="8" cy="16" r="1.2" /><circle cx="14.5" cy="16" r="1.2" /></svg>
          <span className="max-[380px]:sr-only">{t("Shto", "Add")}</span>
        </button>
      </div>
      {added && (
        <p className="mt-2 flex items-center justify-between gap-2 text-[11px] text-lime-dim">
          <span>✓ {item.demo ? t("U shtua · shembull demo", "Added · demo example") : t("U shtua në shportë", "Added to cart")}</span>
          <Link href="/shporta" className="font-semibold underline-offset-2 hover:underline">{t("Shko te shporta →", "Go to cart →")}</Link>
        </p>
      )}
    </div>
  );
}
