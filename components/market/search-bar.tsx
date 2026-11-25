"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { MicButton } from "@/components/tools/mic-button";
import { REGIONS } from "@/lib/tools/inventory";

/** Marketplace search: keywords or a full sentence, location, voice. Submits to /treg keeping other filters. */
export function SearchBar({ big = false, action = "/treg" }: { big?: boolean; action?: string }) {
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [near, setNear] = useState(params.get("afer") ?? "");
  function go(text = q) {
    const next = new URLSearchParams(action === "/treg" ? params.toString() : "");
    if (text) next.set("q", text); else next.delete("q");
    if (near) next.set("afer", near); else next.delete("afer");
    next.delete("faqe");
    router.push(`${action}?${next.toString()}`);
  }
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); go(); }} className={`flex w-full items-center gap-2 rounded-full border border-line bg-card p-1.5 shadow-[0_12px_32px_-20px_rgba(12,47,43,0.45)] ${big ? "md:p-2" : ""}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="ml-3 shrink-0 text-ink-2" aria-hidden><circle cx="9" cy="9" r="5.5" /><path d="M13.2 13.2 17 17" strokeLinecap="round" /></svg>
      <label htmlFor={`kerko-${big ? "b" : "s"}`} className="sr-only">{t("Kërko materiale", "Search materials")}</label>
      <input id={`kerko-${big ? "b" : "s"}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("p.sh. 40 m² parket lisi nën 600 € afër Tiranës", "e.g. 40 m² oak flooring under €600 near Tirana")}
        className={`min-w-0 flex-1 bg-transparent px-1 outline-none placeholder:text-ink-2/70 ${big ? "py-3 text-base md:text-lg" : "py-2 text-sm"}`} />
      <label className="sr-only" htmlFor={`afer-${big ? "b" : "s"}`}>{t("Vendndodhja", "Location")}</label>
      <select id={`afer-${big ? "b" : "s"}`} value={near} onChange={(e) => setNear(e.target.value)} className="hidden max-w-36 rounded-full bg-bg-2 px-3 py-2 text-sm sm:block">
        <option value="">{t("Kudo", "Anywhere")}</option>
        {Object.keys(REGIONS).map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <MicButton onText={(v, final) => { setQ(v); if (final) go(v); }} className="size-10" />
      <button className={`btn-primary shrink-0 ${big ? "md:h-12 md:px-6" : ""}`}>{t("Kërko", "Search")}</button>
    </form>
  );
}
