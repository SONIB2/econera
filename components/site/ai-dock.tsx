"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLang } from "@/components/lang-provider";
import { BasketIcon, ChatIcon, CutIcon, MicIcon, SparkleIcon } from "./tool-icons";

const KEY = "econera.dock";
const EVENT = "econera-dock";
const subscribe = (cb: () => void) => { window.addEventListener(EVENT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); }; };
const readCollapsed = () => { try { return localStorage.getItem(KEY) === "0"; } catch { return false; } };
/** Workflows where floating controls get in the way: auth, checkout, admin and verification forms. */
const HIDDEN = ["/hyr", "/regjistrohu", "/fjalekalimi", "/autentikim", "/admin", "/administrim", "/shporta", "/verifikimi", "/paneli"];

/**
 * ECONERA intelligence dock. Desktop: a slim vertical bar of icon buttons above the Assistant button,
 * labels slide out on hover or focus, and a small control collapses it (remembered per browser).
 * Phones: one AI button that opens a bottom sheet. Both step aside when the footer is on screen.
 */
export function AiDock() {
  const pathname = usePathname();
  const { t } = useLang();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const [sheet, setSheet] = useState(false);
  const [footer, setFooter] = useState(false);
  const [nearTop, setNearTop] = useState(true);
  useEffect(() => {
    const el = document.querySelector("footer[data-global-footer]");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFooter(e.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);
  // On the homepage the 3D building owns the first screen; the dock appears once the visitor scrolls on.
  useEffect(() => {
    const on = () => setNearTop(window.scrollY < window.innerHeight * 0.8);
    const frame = requestAnimationFrame(on);
    window.addEventListener("scroll", on, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", on); };
  }, []);
  const hero = pathname === "/" && nearTop;
  useEffect(() => {
    if (!sheet) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sheet]);

  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  const toggle = () => { try { localStorage.setItem(KEY, collapsed ? "1" : "0"); } catch { /* ignore */ } window.dispatchEvent(new Event(EVENT)); };
  const away = footer || hero;

  const tools = [
    { href: "/ai/renovim", name: "AI Renovation", desc: t("Dizajno me AI", "Design with AI"), Icon: SparkleIcon },
    { href: "/ai/shporta", name: "Smart Basket", desc: t("Materiale sipas buxhetit", "Materials for your budget"), Icon: BasketIcon },
    { href: "/ai/smartcut", name: "SmartCut", desc: t("Optimizo prerjet", "Optimize cuts"), Icon: CutIcon },
    { href: "#asistenti", name: "ECONERA Voice", desc: t("Fol me ECONERA", "Talk to ECONERA"), Icon: MicIcon, voice: true },
  ];

  return (
    <>
      {/* Desktop dock */}
      <nav aria-label={t("Mjetet AI", "AI Tools")} className={`fixed right-4 bottom-[5.5rem] z-40 hidden flex-col items-center gap-2 transition duration-300 md:flex ${away ? "pointer-events-none translate-x-4 opacity-0" : ""}`} inert={away}>
        <button type="button" onClick={toggle} aria-expanded={!collapsed} aria-controls="ai-dock-tools"
          aria-label={collapsed ? t("Shfaq mjetet AI", "Show AI tools") : t("Fshih mjetet AI", "Hide AI tools")}
          className="dock-btn grid place-items-center size-8 text-[#c8f169]/80">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden className={`transition ${collapsed ? "rotate-180" : ""}`}><path d="M3.5 5.5 7 9l3.5-3.5" /></svg>
        </button>
        <ul id="ai-dock-tools" className={`grid gap-2 transition-all duration-300 ${collapsed ? "pointer-events-none max-h-0 -translate-y-2 opacity-0" : "max-h-80"}`} inert={collapsed}>
          {tools.map((tool) => (
            <li key={tool.name} className="group relative flex justify-end">
              <Link href={tool.href} data-open-assistant={tool.voice ? "voice" : undefined} aria-label={tool.name} className="dock-btn grid place-items-center size-12 text-[#c8f169]">
                <tool.Icon className="size-5" />
              </Link>
              <span aria-hidden className="pointer-events-none absolute top-1/2 right-[calc(100%+0.6rem)] -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-full border border-white/10 bg-[#062321]/95 px-3.5 py-1.5 text-[13px] font-medium text-white opacity-0 shadow-lg backdrop-blur transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100">
                {tool.name}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Phone: one button, one sheet */}
      <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-label={t("Mjetet AI", "AI Tools")}
        className={`dock-btn grid place-items-center fixed right-5 bottom-[9.25rem] z-40 size-11 text-[#c8f169] transition md:hidden ${away || sheet ? "pointer-events-none opacity-0" : ""}`}>
        <SparkleIcon className="size-5" />
      </button>
      {sheet && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-labelledby="ai-sheet-title">
          <button type="button" aria-label={t("Mbyll", "Close")} onClick={() => setSheet(false)} className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.5rem] border-t border-white/10 bg-[#062321] px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] text-white shadow-2xl">
            <span aria-hidden className="mx-auto block h-1 w-10 rounded-full bg-white/20" />
            <p id="ai-sheet-title" className="mt-3 px-1 text-sm font-semibold text-[#c8f169]">{t("Mjetet AI", "AI Tools")}</p>
            <ul className="mt-2 grid gap-1">
              {[...tools, { href: "#asistenti", name: t("Asistenti", "Assistant"), desc: t("Kërko, krahaso dhe lundro", "Search, compare and navigate"), Icon: ChatIcon, voice: false, chat: true }].map((tool) => (
                <li key={tool.name}>
                  <Link href={tool.href} data-open-assistant={"chat" in tool ? "" : tool.voice ? "voice" : undefined} onClick={() => setSheet(false)} className="flex min-h-14 items-center gap-3 rounded-xl px-2 hover:bg-white/5">
                    <span className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-[#c8f169]"><tool.Icon className="size-5" /></span>
                    <span><span className="block text-[15px] font-semibold">{tool.name}</span><span className="block text-[13px] text-white/60">{tool.desc}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
