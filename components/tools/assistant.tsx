"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Action, Block, Card, Ctx, Pending, Reply } from "@/lib/assistant/types";
import { cart } from "@/lib/cart";
import { handoff } from "@/lib/tools/projects";
import { MicButton } from "./mic-button";
import { speak, stopSpeaking } from "./speech";

type Msg = { from: "user"; text: string } | { from: "bot"; reply: Reply; id: number };

const YES = /^(po|ok|okay|yes|yeah|konfirmo|konfirmoj|vazhdo|sigurisht|confirm|sure)\b/i;
const NO = /^(jo|no|anulo|cancel|stop|mos)\b/i;
const PREFS = "econera.a11y.v1";

/**
 * ECONERA Voice: text-and-voice shopping and navigation assistant.
 * Replies are structured (categories, product cards, actions) and come from /api/assistant, which only uses real routes
 * and real listings. Adding to the cart or opening Smart Basket always waits for an explicit confirmation.
 */
export function Assistant() {
  const { lang, t } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [voice, setVoice] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [ctx, setCtx] = useState<Ctx>({});
  const [textSize, setTextSize] = useState(100);
  const [contrast, setContrast] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

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
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  const voiceRef = useRef(false);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  const botSay = useCallback((reply: Reply) => {
    setMsgs((m) => [...m, { from: "bot", reply, id: ++seq.current }]);
    if (voiceRef.current) speak(reply.speak, lang);
  }, [lang]);
  const local = (text: string): Reply => ({ text, speak: text, blocks: [], ctx: {} });

  function confirm(yes: boolean) {
    const p = pending;
    setPending(null);
    if (!p) return;
    if (!yes) return botSay(local(t("Në rregull, u anulua.", "OK, cancelled.")));
    if (p.kind === "cart") {
      cart.add({ ...p.item, quantity: p.qty });
      return botSay({ text: p.demo ? t("U shtua në shportë (shembull demo, nuk dërgohet te shitësi).", "Added to your cart (demo example, never sent to a seller).") : t("U shtua në shportë.", "Added to your cart."), speak: t("U shtua në shportë.", "Added to your cart."), ctx: {}, blocks: [{ type: "actions", items: [{ kind: "link", label: t("Shko te shporta", "Go to cart"), href: "/shporta", primary: true }] }] });
    }
    if (p.kind === "basket") {
      handoff.put(p.text);
      botSay(local(t("Po hap Smart Basket me listën tënde.", "Opening Smart Basket with your list.")));
      router.push("/ai/shporta");
    }
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    if (pending && (YES.test(text) || NO.test(text))) return confirm(YES.test(text));
    setPending(null);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang, ctx }) });
      if (!res.ok) throw new Error(String(res.status));
      const reply = (await res.json()) as Reply;
      if (reply.ctx.filters || reply.ctx.items) setCtx(reply.ctx);
      const c = reply.blocks.find((b): b is Extract<Block, { type: "confirm" }> => b.type === "confirm");
      if (c) setPending(c.action);
      botSay(reply);
    } catch {
      botSay(local(t("Nuk arrita të përgjigjem tani. Provo përsëri.", "I couldn't answer right now. Please try again.")));
    } finally { setBusy(false); }
  }

  function addCard(c: Card) {
    const p: Pending = { kind: "cart", item: c.cart, qty: c.qty, demo: c.demo };
    setPending(p);
    const prompt = t(`Të shtoj ${c.qty} ${c.unit} “${c.title}” (${c.price}/${c.unit}) në shportë?`, `Add ${c.qty} ${c.unit} of “${c.title}” (${c.price}/${c.unit}) to your cart?`);
    botSay({ text: prompt, speak: prompt, ctx: {}, blocks: [{ type: "confirm", prompt, action: p }] });
  }

  const starters = [
    [t("Dysheme", "Flooring"), t("dysheme", "flooring")],
    [t("20 m² pllaka në Tiranë", "20 m² tiles in Tirana"), t("Gjej 20 m² pllaka në Tiranë", "Find 20 m² of tiles in Tirana")],
    [t("Dua të shes", "I want to sell"), t("Dua të shes materiale", "I want to sell materials")],
    [t("Rinovo kuzhinën", "Renovate my kitchen"), t("Dua të rinovoj kuzhinën", "I want to renovate my kitchen")],
  ];
  const lastBot = [...msgs].reverse().find((m) => m.from === "bot") as Extract<Msg, { from: "bot" }> | undefined;

  return (
    <>
      <button type="button" onClick={() => { setOpen((v) => !v); if (open) stopSpeaking(); }} aria-expanded={open} aria-controls="asistenti"
        className="fixed right-4 bottom-20 z-50 flex h-14 items-center gap-2 rounded-full bg-lime pr-5 pl-4 font-semibold text-bg shadow-[0_12px_30px_-10px_rgba(12,47,43,0.6)] transition hover:bg-lime-dim md:bottom-6">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><rect x="7" y="2" width="6" height="10" rx="3" /><path d="M4 9.5a6 6 0 0 0 12 0M10 15.5V18" /></svg>
        <span>{open ? t("Mbyll", "Close") : t("Asistenti", "Assistant")}</span>
      </button>

      {open && (
        <div id="asistenti" role="dialog" aria-labelledby="asistenti-titulli" className="fixed inset-x-2 bottom-36 z-50 flex max-h-[76dvh] flex-col overflow-hidden rounded-[1.5rem] border border-line bg-card shadow-[0_30px_80px_-30px_rgba(6,34,30,0.55)] md:inset-x-auto md:right-6 md:bottom-24 md:w-[430px]">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-[#f3f7f1] px-4 py-3 dark:bg-bg-2">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[#0f4a43] text-[#c8f169]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 10.5v3M8 7.5v9M12 4.5v15M16 7.5v9M20 10.5v3" /></svg></span>
              <div><h2 id="asistenti-titulli" className="text-base font-semibold leading-tight">ECONERA Voice</h2><p className="text-xs text-ink-2">{t("Pyet. Zbulo. Ndërto.", "Ask. Discover. Build.")}</p></div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setTextSize((v) => Math.max(100, v - 12))} aria-label={t("Tekst më i vogël", "Smaller text")} className="grid size-8 place-items-center rounded-lg border border-line text-xs">A−</button>
              <button type="button" onClick={() => setTextSize((v) => Math.min(150, v + 12))} aria-label={t("Tekst më i madh", "Larger text")} className="grid size-8 place-items-center rounded-lg border border-line text-sm">A+</button>
              <button type="button" onClick={() => setContrast((v) => !v)} aria-pressed={contrast} aria-label={t("Kontrast i lartë", "High contrast")} className={`grid size-8 place-items-center rounded-lg border ${contrast ? "border-ink bg-ink text-bg" : "border-line"}`}><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" /></svg></button>
              <button type="button" onClick={() => { setVoice((v) => !v); stopSpeaking(); }} aria-pressed={voice} aria-label={t("Lexo përgjigjet me zë", "Read answers aloud")} className={`grid size-8 place-items-center rounded-lg border ${voice ? "border-lime bg-accent" : "border-line"}`}><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M2.5 6h2.5l3.5-2.75v9.5L5 10H2.5z" /><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.75 3.5a6.25 6.25 0 0 1 0 9" /></svg></button>
            </div>
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto scroll-smooth px-3.5 py-4 text-[15px]">
            {msgs.length === 0 && (
              <div>
                <p className="mr-8 rounded-2xl rounded-bl-md bg-[#eef3ec] px-3.5 py-2.5 dark:bg-bg-2">{t("Përshëndetje! Kërko materiale, hap një mjet ose më thuaj çfarë po ndërton.", "Hi! Search materials, open a tool or tell me what you're building.")}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">{starters.map(([l, q]) => <Chip key={l} onClick={() => void send(q)}>{l}</Chip>)}</div>
              </div>
            )}
            {msgs.map((m, i) => m.from === "user"
              ? <p key={i} className="ml-10 rounded-2xl rounded-br-md bg-[#0f4a43] px-3.5 py-2.5 text-white"><span className="sr-only">{t("Ti: ", "You: ")}</span>{m.text}</p>
              : <BotMessage key={i} m={m} latest={m === lastBot} pending={m === lastBot ? pending : null} onAsk={(q) => void send(q)} onConfirm={confirm} onAdd={addCard} onNavigate={() => { if (window.matchMedia("(max-width: 767px)").matches) setOpen(false); }} />)}
            {busy && <p className="mr-8 flex w-max items-center gap-1 rounded-2xl rounded-bl-md bg-[#eef3ec] px-4 py-3 dark:bg-bg-2" aria-label={t("Duke menduar", "Thinking")}>{[0, 1, 2].map((k) => <span key={k} className="size-1.5 animate-bounce rounded-full bg-[#3f7a17]" style={{ animationDelay: `${k * 0.15}s` }} />)}</p>}
          </div>

          <form className="flex items-center gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
            <label htmlFor="asistenti-input" className="sr-only">{t("Mesazhi", "Message")}</label>
            <input id="asistenti-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("p.sh. Gjej 20 m² pllaka në Tiranë", "e.g. Find 20 m² of tiles in Tirana")} className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2.5 text-sm" />
            <MicButton onText={(v, final) => { setInput(v); if (final) { setVoice(true); voiceRef.current = true; void send(v); } }} />
            <button type="submit" disabled={busy} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0f4a43] text-white disabled:opacity-50 dark:bg-lime dark:text-bg" aria-label={t("Dërgo", "Send")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full border border-[#0f4a43]/20 bg-white px-3 py-1.5 text-[13px] font-medium text-[#0f4a43] transition hover:border-[#0f4a43] hover:bg-[#eef8dc] dark:border-line dark:bg-transparent dark:text-ink">{children}</button>;
}

function ActionButton({ a, onAsk, onNavigate }: { a: Action; onAsk: (q: string) => void; onNavigate: () => void }) {
  if (a.kind === "ask") return <Chip onClick={() => onAsk(a.text)}>{a.label}</Chip>;
  if (a.kind === "assistant") return null;
  return (
    <Link href={a.href} onClick={onNavigate} className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${a.primary ? "bg-[#0f4a43] text-white hover:bg-[#0c3a35] dark:bg-lime dark:text-bg" : "border border-[#0f4a43]/25 text-[#0f4a43] hover:border-[#0f4a43] dark:border-line dark:text-ink"}`}>
      {a.label} <span aria-hidden>→</span>
    </Link>
  );
}

function BotMessage({ m, latest, pending, onAsk, onConfirm, onAdd, onNavigate }: { m: Extract<Msg, { from: "bot" }>; latest: boolean; pending: Pending | null; onAsk: (q: string) => void; onConfirm: (yes: boolean) => void; onAdd: (c: Card) => void; onNavigate: () => void }) {
  const { t } = useLang();
  return (
    <div className="mr-4 space-y-2">
      <p className="w-fit rounded-2xl rounded-bl-md bg-[#eef3ec] px-3.5 py-2.5 dark:bg-bg-2"><span className="sr-only">ECONERA: </span>{m.reply.text}</p>
      {m.reply.blocks.map((b, i) => {
        if (b.type === "categories") return (
          <ul key={i} className="grid gap-1.5">
            {b.items.map((c) => (
              <li key={c.href}><Link href={c.href} onClick={onNavigate} className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5 transition hover:border-[#7fb52a] dark:bg-card">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e6f6c4] text-[#2f5d10] dark:bg-lime/15 dark:text-lime"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="m12 4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" /></svg></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{c.label}</span>{c.desc && <span className="block text-xs text-ink-2">{c.desc}</span>}</span>
                <span className="text-xs font-semibold text-[#3f7a17] dark:text-lime">{t("Eksploro", "Explore")} →</span>
              </Link></li>
            ))}
          </ul>
        );
        if (b.type === "products") return (
          <div key={i} className="space-y-1.5">
            {b.demo && <p className="text-[11px] text-ink-2">{t("Shembuj demo, jo oferta reale.", "Demo examples, not real offers.")}</p>}
            <ul className="grid gap-1.5">{b.items.map((c) => <ProductRow key={c.id} c={c} onAdd={onAdd} onNavigate={onNavigate} />)}</ul>
            <Link href={b.allHref} onClick={onNavigate} className="inline-flex text-[13px] font-semibold text-[#3f7a17] underline-offset-4 hover:underline dark:text-lime">{t("Shiko të gjitha produktet që përputhen", "View all matching products")} →</Link>
          </div>
        );
        if (b.type === "actions") return <div key={i} className="flex flex-wrap gap-1.5">{b.items.map((a, k) => <ActionButton key={k} a={a} onAsk={onAsk} onNavigate={onNavigate} />)}</div>;
        if (b.type === "confirm" && latest && pending) return (
          <div key={i} className="flex gap-2">
            <button type="button" onClick={() => onConfirm(true)} className="rounded-full bg-[#0f4a43] px-4 py-2 text-sm font-semibold text-white dark:bg-lime dark:text-bg">{t("Po, konfirmo", "Yes, confirm")}</button>
            <button type="button" onClick={() => onConfirm(false)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold">{t("Jo", "No")}</button>
          </div>
        );
        return null;
      })}
    </div>
  );
}

function ProductRow({ c, onAdd, onNavigate }: { c: Card; onAdd: (c: Card) => void; onNavigate: () => void }) {
  const { t } = useLang();
  return (
    <li className="flex gap-2.5 rounded-xl border border-line bg-white p-2 dark:bg-card">
      <Link href={c.href} onClick={onNavigate} className="relative size-[72px] shrink-0 overflow-hidden rounded-lg bg-bg-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.photo} alt="" loading="lazy" className="size-full object-cover" />
        {c.demo && <span className="absolute inset-x-0 bottom-0 bg-black/60 text-center text-[9px] text-white">Demo</span>}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-ink-2">{c.condition} · {c.region}{c.verified ? ` · ✓ ${c.verified}` : ""}</p>
        <Link href={c.href} onClick={onNavigate} className="line-clamp-1 text-sm font-semibold hover:underline">{c.title}</Link>
        <p className="text-sm"><b className="tabular-nums">{c.price}</b> <span className="text-xs text-ink-2">/ {c.unit} · {c.available}</span></p>
        {c.total && <p className="text-[11px] text-[#3f7a17] dark:text-lime">{c.total}</p>}
        <div className="mt-1 flex gap-1.5">
          <Link href={c.href} onClick={onNavigate} className="rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold hover:border-[#0f4a43]">{t("Shiko", "View")}</Link>
          <button type="button" onClick={() => onAdd(c)} className="rounded-full bg-[#0f4a43] px-2.5 py-1 text-[12px] font-semibold text-white dark:bg-lime dark:text-bg">{t("Shto në shportë", "Add to cart")}</button>
        </div>
      </div>
    </li>
  );
}
