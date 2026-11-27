"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import { ROADMAP_ICONS } from "@/components/roadmap/icons";
import { shortName, STATUS, UPCOMING } from "@/lib/roadmap";

/** Homepage strip under the hero indicators: the upcoming ECONERA products, scrollable sideways. */
export function WhatsNext() {
  const { lang, t } = useLang();
  const strip = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  const move = (dir: 1 | -1) => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[#04211d]/90 text-white backdrop-blur transition hover:border-[#c8f169] hover:text-[#c8f169]";

  return (
    <section aria-labelledby="whats-next" className="mt-7 [@media(max-height:820px)]:mt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="whats-next" className="flex items-center gap-2 text-xs font-semibold text-[#c8f169]"><span aria-hidden className="size-1.5 rounded-full bg-[#c8f169]" />{t("Çfarë vjen më pas", "What's next")}</h2>
        <Link href="/roadmap" className="text-xs text-white/70 underline-offset-4 hover:text-white hover:underline">{t("Shiko planin e produkteve", "Explore our roadmap")}</Link>
      </div>
      <div className="relative mt-3">
        <ul ref={strip} className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ maskImage: edge.end ? undefined : "linear-gradient(90deg,#000 85%,transparent)" }}>
          {UPCOMING.map((p) => {
            const Icon = ROADMAP_ICONS[p.id];
            return (
              <li key={p.id} className="w-[9.75rem] shrink-0 snap-start">
                <Link href={`/roadmap#${p.id}`} title={`${p.name}: ${p.text[lang]}`} className="flex h-full flex-col rounded-xl border border-white/10 bg-[#0a3a33]/55 p-3 backdrop-blur-md transition hover:border-[#c8f169]/50 focus-visible:border-[#c8f169]">
                  <span className="text-[#c8f169]"><Icon className="size-[18px]" /></span>
                  <span className="mt-2 text-[13px] leading-tight font-semibold text-white [@media(max-height:820px)]:mt-1.5">{shortName(p.name)}</span>
                  <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/60 [@media(max-height:820px)]:hidden">{p.text[lang]}</span>
                  <span className="mt-auto pt-2 text-[11px] text-white/45">{STATUS[p.status].label[lang]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {!edge.start && <button type="button" onClick={() => move(-1)} aria-label={t("Produktet e mëparshme", "Previous products")} className={`${arrow} -left-3`}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M7.5 2.5 4 6l3.5 3.5" /></svg></button>}
        {!edge.end && <button type="button" onClick={() => move(1)} aria-label={t("Produktet e tjera", "More products")} className={`${arrow} -right-3`}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4.5 2.5 8 6 4.5 9.5" /></svg></button>}
      </div>
    </section>
  );
}

/** Mobile: one compact link instead of the strip. */
export function WhatsNextLink() {
  const { t } = useLang();
  return (
    <Link href="/roadmap" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#04211d]/60 px-3.5 py-1.5 text-xs text-white/80 backdrop-blur hover:border-[#c8f169] hover:text-white">
      <span aria-hidden className="size-1.5 rounded-full bg-[#c8f169]" />
      {t(`Çfarë vjen më pas: ${UPCOMING.length} produkte në plan`, `What's next: ${UPCOMING.length} products on our roadmap`)}
    </Link>
  );
}
