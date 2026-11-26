"use client";

import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { TEXTURE } from "@/components/home/material-slabs";
import "./tool-previews.css";

/**
 * Interactive product previews for the AI Tools page. They are demonstrations with example data
 * (labelled as such), not live marketplace data. All numbers shown are computed from the example inputs.
 */
function Frame({ name, children }: { name: string; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[14px] border-[6px] border-[#1d2422] bg-white shadow-[0_24px_50px_-28px_rgba(12,47,43,0.6)] dark:bg-card">
        <div className="flex items-center justify-between border-b border-[#0c2f2b]/10 px-3 py-1.5 dark:border-line">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#0c2f2b] dark:text-ink"><span className="size-2 rounded-sm bg-[#7fb52a]" />ECONERA <span className="font-medium text-[#5b6b66]">{name}</span></span>
          <span className="rounded-full bg-[#fff4d6] px-1.5 py-0.5 text-[9px] font-semibold text-[#7a5a0c]">{t("Demo interaktive", "Interactive demo")}</span>
        </div>
        <div className="p-3 text-[#0c2f2b] dark:text-ink">{children}</div>
      </div>
      <div aria-hidden className="mx-auto h-2 w-[108%] -translate-x-[3.7%] rounded-b-xl bg-gradient-to-b from-[#c9ccca] to-[#9aa09d]" />
    </div>
  );
}

const sw = (k: keyof typeof TEXTURE) => ({ backgroundImage: TEXTURE[k], backgroundSize: "cover" });

export function RenovationPreview() {
  const { t } = useLang();
  const [pos, setPos] = useState(50);
  const room = (after: boolean) => (
    <svg viewBox="0 0 320 180" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="320" height="180" fill={after ? "#efe7da" : "#c9c7c2"} />
      <polygon points="0,130 320,130 320,180 0,180" fill={after ? "#b07a47" : "#8f8b84"} />
      {after && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={i * 44} y1="130" x2={i * 44 - 30} y2="180" stroke="#8c5c30" strokeOpacity=".35" />)}
      <rect x="196" y="28" width="90" height="82" fill={after ? "#d9eef0" : "#a9b2b3"} stroke={after ? "#fff" : "#7f8687"} strokeWidth="4" />
      {after ? <>
        <rect x="40" y="96" width="120" height="30" rx="8" fill="#f4f1ea" /><rect x="40" y="84" width="120" height="18" rx="7" fill="#e6e0d4" />
        <rect x="70" y="128" width="70" height="8" rx="2" fill="#6b4a2c" /><circle cx="300" cy="118" r="14" fill="#5f9a37" /><rect x="296" y="118" width="8" height="14" fill="#8c6a3c" />
        <rect x="60" y="34" width="44" height="34" fill="#d1b48c" stroke="#fff" strokeWidth="3" />
      </> : <>
        <path d="M20 20 L60 60 M80 10 l20 40" stroke="#9b9891" strokeWidth="2" /><rect x="90" y="120" width="40" height="12" fill="#7d796f" />
      </>}
    </svg>
  );
  return (
    <Frame name="AI Renovation">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg select-none">
        {room(true)}
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{room(false)}</div>
        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 text-[9px] text-white">{t("Para", "Before")}</span>
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1.5 text-[9px] text-white">{t("Pas", "After")}</span>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }}><span className="absolute top-1/2 left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[10px] shadow">‹›</span></span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={t("Krahaso para dhe pas", "Compare before and after")} className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
      </div>
      <p className="mt-2 text-[10px] font-semibold">{t("Materiale të sugjeruara · 18 m²", "Suggested materials · 18 m²")}</p>
      <ul className="mt-1 grid grid-cols-3 gap-1.5 text-[9px]">
        {([["wood", t("Parket lisi", "Oak flooring"), "≈ 19.8 m²"], ["stone", t("Bojë muri", "Wall paint"), "≈ 11 L"], ["terrazzo", t("Pllaka banjo", "Bath tiles"), "≈ 6.6 m²"]] as const).map(([k, n, q]) => (
          <li key={n} className="flex items-center gap-1.5 rounded-md border border-[#0c2f2b]/10 p-1 dark:border-line"><span className="size-5 shrink-0 rounded" style={sw(k)} /><span className="leading-tight"><b className="block font-semibold">{n}</b>{q}</span></li>
        ))}
      </ul>
    </Frame>
  );
}

export function BasketPreview() {
  const { t } = useLang();
  const options = {
    best: [42, 9.5, 7.8],
    reuse: [31, 6.2, 5.9],
  };
  const [mode, setMode] = useState<keyof typeof options>("best");
  const rows = [
    { k: "wood" as const, n: t("Parket lisi", "Oak flooring"), q: 25, u: "m²" },
    { k: "stone" as const, n: t("Gips-karton", "Gypsum board"), q: 10, u: t("copë", "pcs") },
    { k: "insulation" as const, n: t("Lesh guri", "Rock wool"), q: 30, u: "m²" },
  ];
  const total = rows.reduce((s, r, i) => s + r.q * options[mode][i], 0);
  const base = rows.reduce((s, r, i) => s + r.q * options.best[i], 0);
  return (
    <Frame name="Smart Basket">
      <div className="mb-2 flex gap-1 text-[9px]" role="group" aria-label={t("Kombinimi", "Combination")}>
        {([["best", t("Oferta më e mirë", "Best offer")], ["reuse", t("Më shumë të ripërdorura", "More reclaimed")]] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)} className={`rounded-full border px-2 py-0.5 font-semibold ${mode === k ? "border-[#0f4a43] bg-[#0f4a43] text-white" : "border-[#0c2f2b]/15"}`}>{l}</button>
        ))}
      </div>
      <table className="w-full text-[10px]">
        <thead><tr className="text-left text-[9px] text-[#5b6b66]"><th className="pb-1 font-medium">{t("Materiali", "Material")}</th><th className="pb-1 font-medium">{t("Sasia", "Qty")}</th><th className="pb-1 text-right font-medium">{t("Çmimi", "Price")}</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.n} className="border-t border-[#0c2f2b]/10 dark:border-line">
              <td className="py-1.5"><span className="flex items-center gap-1.5"><span className="size-5 rounded" style={sw(r.k)} />{r.n}</span></td>
              <td>{r.q} {r.u}</td>
              <td className="text-right font-semibold tabular-nums">€{options[mode][i].toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-[#eef8dc] px-2 py-1.5 text-[10px] dark:bg-lime/10">
        <span className="font-semibold">{t("Buxheti i projektit", "Project budget")}</span>
        <span className="flex items-center gap-1.5"><b className="text-[12px] tabular-nums">€{total.toFixed(2)}</b>{total < base && <span className="rounded-full bg-[#c8f169] px-1.5 text-[9px] font-semibold text-[#062321]">−{Math.round((1 - total / base) * 100)}%</span>}</span>
      </div>
      <p className="mt-1 text-[8.5px] text-[#5b6b66]">{t("Çmime shembull, jo oferta reale.", "Example prices, not real offers.")}</p>
    </Frame>
  );
}

/** Guillotine layout of 4 example pieces on a 2440×1220 sheet; utilisation computed from the piece areas. */
export function CutPreview() {
  const { t } = useLang();
  const W = 2440, H = 1220;
  const sets = {
    a: [{ id: "A1", x: 0, y: 0, w: 1200, h: 600 }, { id: "A2", x: 1200, y: 0, w: 1200, h: 600 }, { id: "B1", x: 0, y: 600, w: 800, h: 600 }, { id: "B2", x: 800, y: 600, w: 800, h: 600 }],
    b: [{ id: "A1", x: 0, y: 0, w: 1200, h: 600 }, { id: "A2", x: 1200, y: 0, w: 1200, h: 600 }, { id: "B1", x: 0, y: 600, w: 800, h: 600 }, { id: "B2", x: 800, y: 600, w: 800, h: 600 }, { id: "C1", x: 1600, y: 600, w: 800, h: 300 }],
  };
  const [k, setK] = useState<keyof typeof sets>("a");
  const pieces = sets[k];
  const used = pieces.reduce((s, p) => s + p.w * p.h, 0) / (W * H) * 100;
  const fill = ["#d7f0a8", "#c3e88a", "#e6f6c4", "#b6dd78", "#cfeaa0"];
  return (
    <Frame name="SmartCut">
      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <div>
          <p className="mb-1 text-[9px] font-semibold">{t("Plani i prerjes · panel 2440 × 1220 mm", "Cutting plan · panel 2440 × 1220 mm")}</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-[#0c2f2b]/20" role="img" aria-label={t("Paraqitje e prerjeve në panel", "Layout of cuts on the panel")}>
            <defs><pattern id="hatch" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="60" stroke="#9aa09d" strokeWidth="14" /></pattern></defs>
            <rect width={W} height={H} fill="url(#hatch)" opacity=".35" />
            {pieces.map((p, i) => (
              <g key={p.id}>
                <rect x={p.x + 6} y={p.y + 6} width={p.w - 12} height={p.h - 12} fill={fill[i]} stroke="#3f7a17" strokeWidth="8" />
                <text x={p.x + p.w / 2} y={p.y + p.h / 2 - 20} textAnchor="middle" fontSize="110" fontWeight="700" fill="#0c2f2b">{p.id}</text>
                <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 100} textAnchor="middle" fontSize="80" fill="#335a52">{p.w}×{p.h}</text>
              </g>
            ))}
          </svg>
        </div>
        <dl className="grid content-start gap-1.5 text-[9px]">
          <div className="rounded-md bg-[#eef8dc] px-2 py-1 dark:bg-lime/10"><dt className="text-[#5b6b66]">{t("Përdorimi", "Utilisation")}</dt><dd className="text-[13px] font-bold text-[#3f7a17] tabular-nums">{used.toFixed(1)}%</dd></div>
          <div className="px-2"><dt className="text-[#5b6b66]">{t("Mbetje", "Waste")}</dt><dd className="font-bold tabular-nums">{(100 - used).toFixed(1)}%</dd></div>
          <div className="px-2"><dt className="text-[#5b6b66]">{t("Copa", "Pieces")}</dt><dd className="font-bold">{pieces.length}</dd></div>
        </dl>
      </div>
      <button type="button" onClick={() => setK(k === "a" ? "b" : "a")} className="mt-2 rounded-full border border-[#0c2f2b]/15 px-2 py-0.5 text-[9px] font-semibold hover:border-[#0f4a43]">{k === "a" ? t("+ Shto copën C1 800×300", "+ Add piece C1 800×300") : t("− Hiq C1", "− Remove C1")}</button>
    </Frame>
  );
}

export function VoicePreview() {
  const { lang, t } = useLang();
  const cmds = lang === "en"
    ? ["Find oak flooring near Tirana", "List 20 m² of unused tiles", "Compare insulation materials", "Add 30 m² of parquet to my basket"]
    : ["Gjej parket lisi afër Tiranës", "Listo 20 m² pllaka të papërdorura", "Krahaso materialet izoluese", "Shto 30 m² parket në shportë"];
  const [said, setSaid] = useState(cmds[0]);
  return (
    <Frame name="ECONERA Voice">
      <div className="flex items-center justify-center gap-3 py-2">
        <span aria-hidden className="xp-voice flex h-6 items-end gap-[3px] [&_i]:w-[3px]">{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} style={{ animationDelay: `${k * 0.1}s` }} />)}</span>
        <span className="grid size-12 place-items-center rounded-full bg-[#c8f169] shadow-[0_0_0_8px_rgba(200,241,105,.3),0_0_0_16px_rgba(200,241,105,.12)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#062321" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
        </span>
        <span aria-hidden className="xp-voice flex h-6 items-end gap-[3px] [&_i]:w-[3px]">{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} style={{ animationDelay: `${0.3 + k * 0.1}s` }} />)}</span>
      </div>
      <p className="text-center text-[10px] text-[#5b6b66]" aria-live="polite">“{said}”</p>
      <p className="mt-2 text-[9px] font-semibold">{t("Provo një komandë:", "Try a command:")}</p>
      <ul className="mt-1 flex flex-wrap gap-1">
        {cmds.map((c) => <li key={c}><button type="button" onClick={() => setSaid(c)} aria-pressed={said === c} className={`rounded-full border px-2 py-0.5 text-[9px] ${said === c ? "border-[#3f7a17] bg-[#eef8dc] dark:bg-lime/10" : "border-[#0c2f2b]/15"}`}>{c}</button></li>)}
      </ul>
      <p className="mt-1.5 text-[8.5px] text-[#5b6b66]">{t("Veprimet që publikojnë ose blejnë kërkojnë gjithmonë konfirmimin tënd.", "Actions that publish or buy always ask for your confirmation.")}</p>
    </Frame>
  );
}
