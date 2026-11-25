"use client";

import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { CategoryArt } from "./category-art";

export function Gallery({ photos, title, category, representative }: { photos: string[]; title: string; category: string; representative?: string }) {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  if (!photos.length && representative) photos = [representative];
  if (!photos.length) return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-line bg-bg-2">
      <CategoryArt id={category} />
      <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{t("Ilustrim · shitësi s'ka ngarkuar ende foto të miratuara", "Illustration · no approved photos yet")}</span>
    </div>
  );
  return (
    <div className="grid gap-3">
      <button type="button" onClick={() => setOpen(true)} aria-label={t("Zmadho foton", "Enlarge photo")}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
        onMouseLeave={() => setZoom(null)} className="relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-[1.5rem] border border-line bg-bg-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[i]} alt={`${title} (${i + 1}/${photos.length})`} className="size-full object-cover transition-transform duration-200" style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
        {representative && photos[0] === representative && <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">{t("Foto ilustruese e kategorisë · shitësi s'ka ngarkuar ende foto të miratuara", "Representative category photo · no approved seller photos yet")}</span>}
      </button>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">{photos.map((p, k) => (
          <button key={p} type="button" aria-label={t(`Foto ${k + 1}`, `Photo ${k + 1}`)} aria-pressed={i === k} onClick={() => setI(k)} className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 ${i === k ? "border-lime" : "border-transparent"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p} alt="" className="size-full object-cover" />
          </button>
        ))}</div>
      )}
      {open && (
        <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[i]} alt={title} className="max-h-full max-w-full rounded-xl object-contain" />
          <button type="button" autoFocus onClick={() => setOpen(false)} className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/90 text-black" aria-label={t("Mbyll", "Close")}>✕</button>
        </div>
      )}
    </div>
  );
}
