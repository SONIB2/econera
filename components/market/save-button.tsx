"use client";

import { useSyncExternalStore } from "react";
import { useLang } from "@/components/lang-provider";
import { saved, subscribeCart } from "@/lib/cart";

export function SaveButton({ id, title, href, large = false }: { id: string; title: string; href: string; large?: boolean }) {
  const { t } = useLang();
  const on = useSyncExternalStore(subscribeCart, () => saved.has(id), () => false);
  return (
    <button type="button" aria-pressed={on} aria-label={on ? t(`Hiq nga të ruajturat: ${title}`, `Remove from saved: ${title}`) : t(`Ruaj: ${title}`, `Save: ${title}`)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); saved.toggle({ id, title, href }); }}
      className={`relative z-10 grid place-items-center rounded-full bg-card/90 text-ink shadow backdrop-blur transition hover:scale-105 ${large ? "size-11" : "size-9"}`}>
      <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" className={on ? "text-lime" : ""}><path d="M10 16.5s-6.5-3.8-6.5-8.3A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 6.5 2.2c0 4.5-6.5 8.3-6.5 8.3z" strokeLinejoin="round" /></svg>
    </button>
  );
}
