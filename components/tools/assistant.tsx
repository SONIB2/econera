"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import { formatNumber } from "@/lib/format";
import { candidatesFor, cityPoint, type Requirement } from "@/lib/tools/basket";
import { distanceKm, type Listing } from "@/lib/tools/inventory";
import { sellDraft, sellDraftQuery, understand, type SellDraft } from "@/lib/tools/intents";
import { handoff } from "@/lib/tools/projects";
import { MicButton } from "./mic-button";
import { speak, stopSpeaking } from "./speech";

type Msg = { from: "user" | "bot"; text: string };
type Pending = { kind: "basket"; text: string } | { kind: "sell"; draft: SellDraft } | null;
type Result = { listing: Listing; total: number; km: number };

const YES = /^(po|ok|okay|yes|yeah|konfirmo|konfirmoj|vazhdo|sigurisht|confirm|sure)\b/i;
const NO = /^(jo|no|anulo|cancel|stop|mos)\b/i;
const PREFS = "econera.a11y.v1";

/** ECONERA Voice: floating text-and-voice assistant. Every consequential step waits for an explicit "yes". */
export function Assistant() {
  const { lang, t } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [voice, setVoice] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [results, setResults] = useState<{ req: Requirement; items: Result[] } | null>(null);
  const [textSize, setTextSize] = useState(100);
  const [contrast, setContrast] = useState(false);
  const inventory = useRef<Listing[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Accessibility preferences live on <html> so every page follows them.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const p = JSON.parse(localStorage.getItem(PREFS) ?? "{}") as { size?: number; contrast?: boolean };
        if (p.size) setTextSize(p.size);
        if (p.contrast) setContrast(true);
      } catch { /* ignore */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    html.style.fontSize = textSize === 100 ? "" : `${textSize}%`;
    html.classList.toggle("hc", contrast);
    try { localStorage.setItem(PREFS, JSON.stringify({ size: textSize, contrast })); } catch { /* ignore */ }
  }, [textSize, contrast]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); stopSpeaking(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // Any element with data-open-assistant (e.g. the Voice card) opens the panel.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-open-assistant]");
      if (el) { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [msgs]);

  const voiceRef = useRef(false);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  const say = useCallback((text: string) => {
    setMsgs((m) => [...m, { from: "bot", text }]);
    if (voiceRef.current) speak(text, lang);
  }, [lang]);

  async function stock() {
    if (!inventory.current) {
      const res = await fetch("/api/tools/inventory");
      inventory.current = ((await res.json()) as { listings: Listing[] }).listings;
    }
    return inventory.current;
  }

  function describe(items: Result[], unit: string) {
    return items.map((r, i) => `${i + 1}. ${r.listing.title}, ${r.listing.sellerName}, ${r.listing.city} (${formatNumber(r.km, 0)} km): ${formatNumber(r.listing.priceLek, 0)} ${t("lekë", "lek")}/${r.listing.unit}, ${t("gjithsej", "total")} ${formatNumber(r.total, 0)} ${t("lekë", "lek")}${r.listing.source === "demo" ? t(" (shembull demo)", " (demo example)") : ""}`).join(". ") + (unit ? "" : "");
  }

  async function handle(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");

    if (pending) {
      if (YES.test(text)) {
        if (pending.kind === "basket") { handoff.put(pending.text); setPending(null); say(t("U shtua. Po hap Smart Basket.", "Added. Opening Smart Basket.")); router.push("/ai/shporta"); return; }
        if (pending.kind === "sell") { const q = sellDraftQuery(pending.draft); setPending(null); say(t("Po hap formularin e listimit me të dhënat. Shto fotot dhe ruaje vetë; publikimi bëhet pas miratimit.", "Opening the listing form with your details. Add photos and save it yourself; publishing follows review.")); router.push(`/inventari/i-ri?${q}`); return; }
      }
      if (NO.test(text)) { setPending(null); say(t("Në rregull, u anulua.", "OK, cancelled.")); return; }
      if (pending.kind === "sell") {
        const merged = { ...pending.draft, ...Object.fromEntries(Object.entries(sellDraft(`${text}`, pending.draft.category ?? "")).filter(([k, v]) => v !== undefined && (pending.draft as Record<string, unknown>)[k] === undefined)) } as SellDraft;
        return askSell(merged);
      }
    }

    if (results && /(më i lir|me i lir|cheapest|lowest price)/i.test(text)) { const items = [...results.items].sort((a, b) => a.total - b.total).slice(0, 3); setResults({ ...results, items }); return say(describe(items, "")); }
    if (results && /(më afër|me afer|closest|nearest)/i.test(text)) { const items = [...results.items].sort((a, b) => a.km - b.km).slice(0, 3); setResults({ ...results, items }); return say(describe(items, "")); }
    if (results && /(krahaso|compare)/i.test(text)) {
      const [a, b] = results.items;
      if (a && b) return say(t(`Oferta 1 kushton ${formatNumber(a.total, 0)} lekë dhe është ${formatNumber(a.km, 0)} km larg. Oferta 2 kushton ${formatNumber(b.total, 0)} lekë dhe është ${formatNumber(b.km, 0)} km larg.`, `Offer 1 costs ${formatNumber(a.total, 0)} lek and is ${formatNumber(a.km, 0)} km away. Offer 2 costs ${formatNumber(b.total, 0)} lek and is ${formatNumber(b.km, 0)} km away.`));
    }
    if (results && /(shto|add).*(shport|basket)|^(shtoje|add it)/i.test(text)) {
      const r = results.req;
      setPending({ kind: "basket", text: `${r.quantity} ${r.unit ?? ""} ${r.text}` });
      return say(t(`Ta shtoj "${r.quantity} ${r.unit ?? ""} ${r.text}" në Smart Basket? Thuaj po ose jo.`, `Add "${r.quantity} ${r.unit ?? ""} ${r.text}" to Smart Basket? Say yes or no.`));
    }

    const intent = understand(text);
    switch (intent.kind) {
      case "help":
        return say(t("Mund të më thuash p.sh.: \"Gjej 30 m² parket nën 300 euro afër Tiranës\", \"Kam 25 m² pllaka bezhë në Tiranë, i shes 8 euro për m²\", \"Shto 3 dyer në shportë\" ose \"Hap SmartCut\".", "You can say e.g.: \"Find 30 m² of parquet under 300 euros near Tirana\", \"I have 25 m² of beige tiles in Tirana, selling at 8 euros per m²\", \"Add 3 doors to the basket\" or \"Open SmartCut\"."));
      case "navigate":
        say(t(`Po hap ${intent.nameSq}.`, `Opening ${intent.nameEn}.`));
        router.push(intent.href);
        return;
      case "basket":
        setPending({ kind: "basket", text: intent.text });
        return say(t(`Ta shtoj "${intent.text}" në Smart Basket? Thuaj po ose jo.`, `Add "${intent.text}" to Smart Basket? Say yes or no.`));
      case "sell":
        return askSell(intent.draft);
      case "search": {
        const all = await stock().catch(() => null);
        if (!all) return say(t("Nuk arrita të lexoj tregun tani. Provo përsëri.", "I couldn't read the market right now. Try again."));
        const from = cityPoint(intent.city ?? "Tiranë");
        const req = intent.requirement;
        let items = candidatesFor(req, all).map((l) => ({ listing: l, total: Math.min(req.quantity, l.quantity) * l.priceLek, km: distanceKm(from, l.point) }));
        if (intent.maxTotalLek) items = items.filter((r) => r.total <= intent.maxTotalLek!);
        items = items.sort((a, b) => a.total / Math.min(req.quantity, a.listing.quantity) - b.total / Math.min(req.quantity, b.listing.quantity) || a.km - b.km).slice(0, 3);
        setResults({ req, items });
        if (!items.length) return say(t("Nuk gjeta oferta që plotësojnë këtë kërkesë. Provo pa kufi çmimi ose në një qytet tjetër.", "I found no offers for this request. Try without a price limit or in another city."));
        const partial = items.some((r) => r.listing.quantity < req.quantity);
        return say(`${t(`Gjeta ${items.length} oferta`, `I found ${items.length} offers`)}. ${describe(items, req.unit ?? "")}.${partial ? t(" Disa oferta nuk e mbulojnë të gjithë sasinë.", " Some offers do not cover the full quantity.") : ""} ${t("Thuaj \"më i liri\", \"më afër\", \"krahaso\" ose \"shtoje në shportë\".", "Say \"cheapest\", \"closest\", \"compare\" or \"add it to the basket\".")}`);
      }
      default:
        return say(t("Nuk e kuptova. Provo p.sh. \"Gjej 20 m² pllaka në Tiranë\" ose thuaj \"ndihmë\".", "I didn't understand. Try e.g. \"Find 20 m² of tiles in Tirana\" or say \"help\"."));
    }
  }

  function askSell(draft: SellDraft) {
    const missing = (["quantity", "unit", "price", "region"] as const).filter((k) => draft[k] === undefined);
    setPending({ kind: "sell", draft });
    if (missing.length) {
      const names = { quantity: t("sasia", "quantity"), unit: t("njësia (m², copë…)", "unit (m², pieces…)"), price: t("çmimi për njësi", "price per unit"), region: t("qyteti", "city") };
      return say(t(`Më thuaj edhe: ${missing.map((m) => names[m]).join(", ")}.`, `Please also tell me: ${missing.map((m) => names[m]).join(", ")}.`));
    }
    const cur = draft.currency === "EUR" ? "€" : t("lekë", "lek");
    return say(t(`Listimi: ${draft.quantity} ${draft.unit} ${draft.title}, ${draft.condition === "reusable" ? "të ripërdorura" : "të papërdorura"}, në ${draft.region}, ${draft.price} ${cur} për ${draft.unit}. Do të duhen edhe foto. Ta hap formularin për ta kontrolluar dhe ruajtur? Thuaj po ose jo.`,
      `Listing: ${draft.quantity} ${draft.unit} ${draft.title}, ${draft.condition === "reusable" ? "reclaimed" : "unused"}, in ${draft.region}, ${draft.price} ${cur} per ${draft.unit}. Photos are needed too. Open the form to review and save it? Say yes or no.`));
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen((v) => !v); if (open) stopSpeaking(); }} aria-expanded={open} aria-controls="asistenti"
        className="fixed right-4 bottom-20 z-50 flex h-14 items-center gap-2 rounded-full bg-lime pr-5 pl-4 font-semibold text-bg shadow-[0_12px_30px_-10px_rgba(12,47,43,0.6)] transition hover:bg-lime-dim md:bottom-6">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><rect x="7" y="2" width="6" height="10" rx="3" /><path d="M4 9.5a6 6 0 0 0 12 0M10 15.5V18" /></svg>
        <span>{open ? t("Mbyll", "Close") : t("Asistenti", "Assistant")}</span>
      </button>

      {open && (
        <div id="asistenti" role="dialog" aria-labelledby="asistenti-titulli" className="fixed inset-x-3 bottom-36 z-50 flex max-h-[70dvh] flex-col overflow-hidden rounded-card border border-line bg-card shadow-2xl md:inset-x-auto md:right-6 md:bottom-24 md:w-[400px]">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id="asistenti-titulli" className="text-lg">ECONERA Voice</h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setTextSize((v) => Math.max(100, v - 12))} aria-label={t("Tekst më i vogël", "Smaller text")} className="grid size-9 place-items-center rounded-lg border border-line text-sm">A−</button>
              <button type="button" onClick={() => setTextSize((v) => Math.min(150, v + 12))} aria-label={t("Tekst më i madh", "Larger text")} className="grid size-9 place-items-center rounded-lg border border-line text-base">A+</button>
              <button type="button" onClick={() => setContrast((v) => !v)} aria-pressed={contrast} aria-label={t("Kontrast i lartë", "High contrast")} className={`grid size-9 place-items-center rounded-lg border ${contrast ? "border-ink bg-ink text-bg" : "border-line"}`}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" /></svg></button>
              <button type="button" onClick={() => { setVoice((v) => !v); stopSpeaking(); }} aria-pressed={voice} aria-label={t("Lexo përgjigjet me zë", "Read answers aloud")} className={`grid size-9 place-items-center rounded-lg border ${voice ? "border-lime bg-accent" : "border-line"}`}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M2.5 6h2.5l3.5-2.75v9.5L5 10H2.5z" /><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.75 3.5a6.25 6.25 0 0 1 0 9" /></svg></button>
            </div>
          </div>
          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[15px]">
            {msgs.length === 0 && <p className="text-ink-2">{t("Përshëndetje. Kërko materiale, listo stokun tënd ose hap një mjet. Shkruaj ose shtyp mikrofonin.", "Hello. Search materials, list your stock or open a tool. Type or press the microphone.")}</p>}
            {msgs.map((m, i) => (
              <p key={i} className={m.from === "user" ? "ml-8 rounded-2xl rounded-br-md bg-lime px-3.5 py-2.5 text-bg" : "mr-8 rounded-2xl rounded-bl-md bg-bg-2 px-3.5 py-2.5"}>
                <span className="sr-only">{m.from === "user" ? t("Ti: ", "You: ") : "ECONERA: "}</span>{m.text}
              </p>
            ))}
            {pending && <div className="flex gap-2"><button type="button" className="btn-primary" onClick={() => void handle(lang === "en" ? "yes" : "po")}>{t("Po, konfirmo", "Yes, confirm")}</button><button type="button" className="btn-ghost" onClick={() => void handle(lang === "en" ? "no" : "jo")}>{t("Jo", "No")}</button></div>}
          </div>
          <form className="flex items-center gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); void handle(input); }}>
            <label htmlFor="asistenti-input" className="sr-only">{t("Mesazhi", "Message")}</label>
            <input id="asistenti-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("p.sh. Gjej 30 m² parket në Tiranë", "e.g. Find 30 m² parquet in Tirana")} className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2.5 text-sm" />
            <MicButton onText={(v, final) => { setInput(v); if (final) { setVoice(true); voiceRef.current = true; void handle(v); } }} />
            <button type="submit" className="btn-primary px-4" aria-label={t("Dërgo", "Send")}>↑</button>
          </form>
        </div>
      )}
    </>
  );
}
