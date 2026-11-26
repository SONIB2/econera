"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLang } from "@/components/lang-provider";
import { cart, subscribeCart } from "@/lib/cart";
import { COUNTRY_GROUPS, flagUrl, LANG_COOKIE, LANGS, parseRegion, REGION_COOKIE, REGIONS, type Lang, type Region } from "@/lib/lang";

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", down); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", down); window.removeEventListener("keydown", key); };
  }, [open]);
  return { open, setOpen, ref };
}

const readRegion = () => parseRegion(decodeURIComponent(document.cookie.split("; ").find((c) => c.startsWith(`${REGION_COOKIE}=`))?.split("=")[1] ?? ""));

const subscribeNever = () => () => {};
function persist(next: { lang: Lang } & Region) {
  document.cookie = `${LANG_COOKIE}=${next.lang}; path=/; max-age=31536000; samesite=lax`;
  document.cookie = `${REGION_COOKIE}=${encodeURIComponent(JSON.stringify({ country: next.country, currency: next.currency, units: next.units }))}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = next.lang;
}
const countryNow = () => readRegion().country;

/**
 * Globe button: pick a country and the site adapts (language, currency, units). Language, currency and units
 * can still be changed independently. Only validated languages are selectable.
 */
/** Country, language and currency picker. `pill` renders it as an inline selector (flag + text) instead of the header globe. */
export function RegionMenu({ compact = false, pill }: { compact?: boolean; pill?: string }) {
  const { lang, t } = useLang();
  const router = useRouter();
  const { open, setOpen, ref } = usePopover();
  const country = useSyncExternalStore(subscribeNever, countryNow, () => "AL");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Region>({ country: "AL", currency: "ALL", units: "metric" });
  const current = REGIONS.find((r) => r.country === country) ?? REGIONS[0];
  const openMenu = () => { setDraft(readRegion()); setQuery(""); setOpen(true); };
  function apply(next: { lang: Lang } & Region) {
    persist(next);
    setOpen(false);
    router.refresh();
  }
  const pick = (code: string) => { const r = REGIONS.find((x) => x.country === code)!; apply({ lang: r.lang, country: r.country, currency: r.currency, units: r.units }); };
  const q = query.trim().toLowerCase();
  const matches = (r: (typeof REGIONS)[number]) => !q || r.en.toLowerCase().includes(q) || r.sq.toLowerCase().includes(q) || r.country.toLowerCase() === q;
  const sel = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";
  return (
    <div ref={ref} className="relative">
      {pill ? (
        <button type="button" onClick={() => (open ? setOpen(false) : openMenu())} aria-expanded={open} aria-haspopup="dialog"
          className="flex min-h-10 items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pr-3.5 pl-2 text-left text-sm text-white/90 backdrop-blur transition hover:border-[#c8f169]/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagUrl(current.country)} alt="" width={22} height={15} className="h-[15px] w-[22px] shrink-0 rounded-[2px] object-cover" />
          <span>{pill}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="shrink-0"><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
        </button>
      ) : (
      <button type="button" onClick={() => (open ? setOpen(false) : openMenu())} aria-expanded={open} aria-haspopup="dialog" aria-label={t(`Shteti: ${current.sq}, gjuha: ${lang}`, `Country: ${current.en}, language: ${lang}`)}
        className="flex h-10 items-center gap-2 rounded-full px-2.5 text-sm font-medium text-ink-2 hover:bg-bg-2 hover:text-ink">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9S14.6 18.5 12 21c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z" /></svg>
        {!compact && <span className="uppercase">{lang}</span>}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="max-sm:hidden"><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
      </button>
      )}
      {open && (
        <div role="dialog" aria-label={t("Shteti dhe gjuha", "Country and language")} className={`fixed inset-x-3 top-20 z-50 grid max-h-[calc(100dvh-6rem)] gap-4 overflow-y-auto rounded-[1.5rem] border border-line bg-card p-5 text-ink shadow-2xl sm:absolute sm:inset-x-auto sm:top-[calc(100%+0.5rem)] ${pill ? "sm:left-0" : "sm:right-0"} sm:w-[640px]`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-lg font-semibold tracking-tight">{t("Zgjidh shtetin", "Choose your country")}</p><p className="text-sm text-ink-2">{t("Gjuha, monedha dhe njësitë përshtaten automatikisht.", "Language, currency and units adapt automatically.")}</p></div>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Kërko shtetin", "Search country")} aria-label={t("Kërko shtetin", "Search country")} className="h-10 w-48 rounded-full border border-line bg-bg px-4 text-sm" />
          </div>
          {COUNTRY_GROUPS.map((g) => {
            const list = REGIONS.filter((r) => r.group === g.id && matches(r));
            if (!list.length) return null;
            return (
              <section key={g.id} aria-label={g[lang]}>
                <p className="mb-2 text-xs font-semibold text-ink-2">{g[lang]}</p>
                <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {list.map((r) => (
                    <li key={r.country}>
                      <button type="button" onClick={() => pick(r.country)} aria-current={r.country === country ? "true" : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition ${r.country === country ? "border-lime bg-accent" : "border-transparent hover:border-line hover:bg-bg-2"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={flagUrl(r.country)} alt="" width={22} height={15} loading="lazy" className="h-[15px] w-[22px] shrink-0 rounded-[2px] object-cover ring-1 ring-black/10" />
                        <span className="min-w-0"><span className="block truncate font-medium">{r[lang]}</span><span className="block truncate text-[11px] text-ink-2">{r.lang === "sq" ? "Shqip" : "English"} · {r.currency}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <div className="grid gap-3 rounded-2xl bg-bg-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm font-medium">{t("Gjuha", "Language")}</p>
              <p className="text-xs text-ink-2">{t("Gjermanisht, italisht, frëngjisht, spanjisht, greqisht e të tjera vijnë sapo të verifikohen përkthimet.", "German, Italian, French, Spanish, Greek and more arrive once their translations are verified.")}</p>
            </div>
            <div className="flex rounded-full border border-line bg-card p-1" role="group" aria-label={t("Gjuha", "Language")}>
              {LANGS.map((l) => <button key={l.id} type="button" aria-pressed={lang === l.id} onClick={() => apply({ lang: l.id, ...readRegion() })} className={`rounded-full px-4 py-1.5 text-sm font-medium ${lang === l.id ? "bg-ink text-bg" : "text-ink-2"}`}>{l.native}</button>)}
            </div>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">{t("Monedha dhe njësitë", "Currency and units")}</summary>
            <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <label className="grid gap-1"><span className="text-xs text-ink-2">{t("Monedha", "Currency")}</span><select className={sel} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value as Region["currency"] })}>{["ALL", "EUR", "GBP", "USD"].map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="grid gap-1"><span className="text-xs text-ink-2">{t("Njësitë", "Units")}</span><select className={sel} value={draft.units} onChange={(e) => setDraft({ ...draft, units: e.target.value as Region["units"] })}><option value="metric">{t("Metrike", "Metric")}</option><option value="imperial">{t("Imperiale", "Imperial")}</option></select></label>
              <button type="button" onClick={() => apply({ lang, ...draft })} className="btn-primary h-10">{t("Ruaj", "Save")}</button>
            </div>
            <p className="mt-2 text-xs text-ink-2">{t("Çmimi origjinal i shitësit shfaqet gjithmonë; konvertimet janë orientuese.", "The seller's original price is always shown; conversions are indicative.")}</p>
          </details>
        </div>
      )}
    </div>
  );
}

const themeNow = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const subscribeTheme = (cb: () => void) => { const o = new MutationObserver(cb); o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); return () => o.disconnect(); };

export function ThemeToggle() {
  const { t } = useLang();
  const theme = useSyncExternalStore(subscribeTheme, themeNow, () => "light");
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("econera.theme", next); } catch { /* ignore */ }
  };
  return (
    <button type="button" onClick={toggle} aria-label={theme === "dark" ? t("Kalo në temën e çelët", "Switch to light theme") : t("Kalo në temën e errët", "Switch to dark theme")} className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-bg-2 hover:text-ink">
      {theme === "dark"
        ? <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><circle cx="10" cy="10" r="3.5" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" /></svg>
        : <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden><path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9z" /></svg>}
    </button>
  );
}

const cartCount = () => cart.count();
export function CartButton() {
  const { t } = useLang();
  const n = useSyncExternalStore(subscribeCart, cartCount, () => 0);
  return (
    <Link href="/shporta" aria-label={t(`Shporta, ${n} artikuj`, `Cart, ${n} items`)} className="relative grid size-10 place-items-center rounded-full text-ink-2 hover:bg-bg-2 hover:text-ink">
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden><path d="M2.5 3.5h2l1.8 9h9l1.7-6.5H5.4" /><circle cx="7.5" cy="16" r="1.2" /><circle cx="14" cy="16" r="1.2" /></svg>
      {n > 0 && <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] font-semibold text-bg">{n}</span>}
    </Link>
  );
}
