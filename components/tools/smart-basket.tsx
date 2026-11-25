"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/components/lang-provider";
import { formatNumber } from "@/lib/format";
import { CITIES } from "@/lib/market";
import { buildPlans, candidatesFor, cityPoint, parseBudget, parseCsv, parseRequirements, planToCsv, type Plan, type Requirement } from "@/lib/tools/basket";
import { EUR_TO_LEK, type Listing } from "@/lib/tools/inventory";
import { categoryLabel, CONDITION_LABEL, MODE_LABEL, MODE_TEXT, TOOL_CATEGORIES } from "@/lib/tools/labels";
import { handoff, projects } from "@/lib/tools/projects";
import { MicButton } from "./mic-button";
import { speak } from "./speech";

const UNITS = ["m²", "copë", "m", "m³", "kovë", "thes", "ton", "kuti"];
const lek = (n: number) => `${formatNumber(Math.round(n), 0)} L`;

export type BasketState = { requirements: Requirement[]; city: string; budgetLek?: number; pinned: Record<string, string>; excluded: string[] };

export function SmartBasket({ listings, live, connected }: { listings: Listing[]; live: number; connected: boolean }) {
  const { lang, t } = useLang();
  const [text, setText] = useState("");
  const [state, setState] = useState<BasketState>({ requirements: [], city: "Tiranë", pinned: {}, excluded: [] });
  const [budgetInput, setBudgetInput] = useState("");
  const [currency, setCurrency] = useState<"L" | "EUR">("EUR");
  const [active, setActive] = useState<Plan["mode"]>("balanced");
  const [notice, setNotice] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>();

  // Needs handed over from another tool (AI Renovation, SmartCut, Voice) or a saved project.
  useEffect(() => {
    const timer = setTimeout(restore, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function restore() {
    const incoming = handoff.take();
    const params = new URLSearchParams(window.location.search);
    const open = params.get("projekt");
    if (open) {
      const p = projects.get(open);
      if (p?.kind === "shporta") {
        const saved = p.data as BasketState;
        setState(saved); setProjectId(p.id);
        if (saved.budgetLek) { setCurrency("L"); setBudgetInput(String(saved.budgetLek)); }
        return;
      }
    }
    if (!incoming) return;
    if (incoming.startsWith("{")) {
      try {
        const { items } = JSON.parse(incoming) as { items: { text: string; category: string; quantity: number; unit: string; listingId?: string }[] };
        const reqs: Requirement[] = items.map((it, i) => ({ id: `h${i}${Date.now().toString(36)}`, text: it.text, category: it.category, quantity: it.quantity, unit: it.unit, words: it.text.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 3) }));
        const pinned = Object.fromEntries(items.map((it, i) => [reqs[i].id, it.listingId]).filter(([, v]) => v)) as Record<string, string>;
        setState((s) => ({ ...s, requirements: [...s.requirements, ...reqs], pinned: { ...s.pinned, ...pinned } }));
        return;
      } catch { /* fall through to text */ }
    }
    setText(incoming); read(incoming);
  }

  const budgetLek = useMemo(() => {
    const n = Number(budgetInput.replace(/[\s,]/g, ""));
    return n > 0 ? Math.round(currency === "EUR" ? n * EUR_TO_LEK : n) : undefined;
  }, [budgetInput, currency]);

  const plans = useMemo(() => state.requirements.length
    ? buildPlans({ requirements: state.requirements, listings, from: cityPoint(state.city), budgetLek, pinned: state.pinned, excluded: state.excluded })
    : [], [state, listings, budgetLek]);
  const plan = plans.find((p) => p.mode === active);

  function read(source: string) {
    const reqs = parseRequirements(source);
    const budget = parseBudget(source);
    if (budget) { setCurrency("L"); setBudgetInput(String(budget)); }
    const city = (Object.keys(CITIES) as string[]).find((c) => source.toLowerCase().includes(c.toLowerCase().slice(0, 5)));
    setState((s) => ({ ...s, requirements: reqs, city: city ?? s.city, pinned: {}, excluded: [] }));
    setNotice(reqs.length ? null : t("Nuk gjeta materiale në tekst. Shkruaj p.sh. \"30 m² parket\".", "No materials found. Try e.g. \"30 m² parquet\"."));
  }

  async function upload(file: File) {
    setNotice(null);
    try {
      if (/\.xlsx$/i.test(file.name)) {
        const { readSheet } = await import("read-excel-file/browser");
        const rows = await readSheet(file);
        const csv = rows.map((r) => r.map((c) => (c ?? "").toString()).join(";")).join("\n");
        const reqs = parseCsv(csv);
        setState((s) => ({ ...s, requirements: reqs, pinned: {}, excluded: [] }));
        if (!reqs.length) setNotice(t("Skedari nuk kishte rreshta që njihen si materiale.", "The file had no rows recognised as materials."));
      } else if (/\.(csv|txt|tsv)$/i.test(file.name)) {
        const reqs = parseCsv(await file.text());
        setState((s) => ({ ...s, requirements: reqs, pinned: {}, excluded: [] }));
        if (!reqs.length) setNotice(t("Skedari nuk kishte rreshta që njihen si materiale.", "The file had no rows recognised as materials."));
      } else {
        setNotice(t("Për tani pranohen .xlsx, .csv dhe .txt. Leximi i PDF vjen në fazën tjetër.", "For now .xlsx, .csv and .txt are accepted. PDF reading comes next."));
      }
    } catch {
      setNotice(t("Skedari nuk u lexua. Kontrollo formatin.", "The file could not be read. Check the format."));
    }
  }

  const update = (id: string, patch: Partial<Requirement>) =>
    setState((s) => ({ ...s, requirements: s.requirements.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const removeReq = (id: string) => setState((s) => ({ ...s, requirements: s.requirements.filter((r) => r.id !== id) }));
  const addReq = () => setState((s) => ({ ...s, requirements: [...s.requirements, { id: `r${Date.now().toString(36)}`, text: "", category: "parket", quantity: 1, unit: "m²", words: [] }] }));

  function save() {
    const title = state.requirements.map((r) => `${r.quantity} ${r.unit ?? ""} ${categoryLabel(r.category, lang).toLowerCase()}`).slice(0, 3).join(", ");
    const p = projects.save("shporta", title || t("Shportë", "Basket"), { ...state, budgetLek }, projectId);
    setProjectId(p.id);
    setNotice(t("U ruajt te Projektet e mia.", "Saved to My projects."));
  }

  function exportCsv() {
    if (!plan) return;
    const blob = new Blob(["﻿" + planToCsv(plan, state.requirements)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `econera-shporta-${plan.mode}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function readAloud() {
    if (!plan) return;
    const sq = `${MODE_LABEL.sq[plan.mode]}. Totali i vlerësuar ${formatNumber(plan.totalLek, 0)} lekë, nga ${plan.sellers} shitës. ${plan.lines.slice(0, 5).map((l) => `${formatNumber(l.take, 1)} ${l.listing.unit} ${l.listing.title} nga ${l.listing.sellerName}`).join(". ")}.${plan.missing.length ? ` Mungojnë ${plan.missing.length} materiale.` : ""}`;
    const en = `${MODE_LABEL.en[plan.mode]}. Estimated total ${formatNumber(plan.totalLek, 0)} lek, from ${plan.sellers} sellers. ${plan.lines.slice(0, 5).map((l) => `${formatNumber(l.take, 1)} ${l.listing.unit} ${l.listing.title} from ${l.listing.sellerName}`).join(". ")}.${plan.missing.length ? ` ${plan.missing.length} items are missing.` : ""}`;
    speak(lang === "en" ? en : sq, lang);
  }

  const example = t("Më duhen 45 m² parket lisi, 20 m² pllaka banjoje bezhë, tri dyer të brendshme dhe 4 kova bojë e bardhë. Buxheti maksimal 1500 euro, në Tiranë.",
    "I need 45 m² of oak flooring, 20 m² of beige bathroom tiles, three interior doors and 4 buckets of white paint. Maximum budget €1,500, in Tirana.");

  return (
    <div className="grid gap-6">
      <section aria-labelledby="nevojat" className="card p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="nevojat" className="text-2xl">{t("Çfarë të duhet?", "What do you need?")}</h2>
            <p className="mt-1 text-sm text-ink-2">{t("Shkruaj, fol ose ngarko listën. Mund t'i ndryshosh rreshtat më poshtë.", "Type, speak or upload a list. You can edit the rows below.")}</p>
          </div>
          <SourceBadge live={live} connected={connected} />
        </div>
        <div className="mt-5 flex gap-3">
          <label className="sr-only" htmlFor="kerkesa">{t("Përshkrimi i materialeve", "Material description")}</label>
          <textarea id="kerkesa" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={example}
            className="min-h-24 w-full resize-y rounded-xl border border-line bg-bg px-4 py-3 text-[15px] placeholder:text-ink-2/70 focus:border-lime focus:outline-none" />
          <MicButton onText={(v, final) => { setText(v); if (final) read(v); }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" onClick={() => read(text || example)}>{t("Lexo nevojat", "Read the needs")}</button>
          <label className="btn-ghost cursor-pointer">
            <input type="file" accept=".xlsx,.csv,.txt,.tsv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            {t("Ngarko Excel / CSV", "Upload Excel / CSV")}
          </label>
          {!text && <button type="button" className="text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline" onClick={() => { setText(example); read(example); }}>{t("Provo shembullin", "Try the example")}</button>}
        </div>
        {notice && <p role="status" className="mt-4 rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{notice}</p>}
      </section>

      {state.requirements.length > 0 && (
        <section aria-labelledby="lista" className="card p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="lista" className="text-2xl">{t("Lista e materialeve", "Material list")}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">{t("Afër", "Near")}
                <select value={state.city} onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))} className="rounded-lg border border-line bg-bg px-3 py-2">
                  {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">{t("Buxheti", "Budget")}
                <input inputMode="numeric" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder={t("pa kufi", "no limit")} className="w-28 rounded-lg border border-line bg-bg px-3 py-2" />
                <select aria-label={t("Monedha", "Currency")} value={currency} onChange={(e) => setCurrency(e.target.value as "L" | "EUR")} className="rounded-lg border border-line bg-bg px-2 py-2"><option value="EUR">€</option><option value="L">L</option></select>
              </label>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-ink-2"><tr><th className="pb-2 font-medium">{t("Përshkrimi", "Description")}</th><th className="pb-2 font-medium">{t("Kategoria", "Category")}</th><th className="pb-2 font-medium">{t("Sasia", "Quantity")}</th><th className="pb-2 font-medium">{t("Njësia", "Unit")}</th><th className="pb-2 font-medium">{t("Në treg", "In market")}</th><th /></tr></thead>
              <tbody>
                {state.requirements.map((r) => {
                  const available = candidatesFor(r, listings).reduce((s, l) => s + l.quantity, 0);
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <td className="py-2 pr-3"><input aria-label={t("Përshkrimi", "Description")} value={r.text} onChange={(e) => update(r.id, { text: e.target.value, words: e.target.value.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 3) })} className="w-full rounded-lg border border-line bg-bg px-3 py-2" /></td>
                      <td className="py-2 pr-3"><select aria-label={t("Kategoria", "Category")} value={r.category ?? ""} onChange={(e) => update(r.id, { category: e.target.value })} className="w-full rounded-lg border border-line bg-bg px-2 py-2">{TOOL_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c, lang)}</option>)}</select></td>
                      <td className="py-2 pr-3"><input aria-label={t("Sasia", "Quantity")} type="number" min={0} step="any" value={r.quantity} onChange={(e) => update(r.id, { quantity: Math.max(0, Number(e.target.value)) })} className="w-24 rounded-lg border border-line bg-bg px-3 py-2 tabular-nums" /></td>
                      <td className="py-2 pr-3"><select aria-label={t("Njësia", "Unit")} value={r.unit ?? ""} onChange={(e) => update(r.id, { unit: e.target.value || undefined })} className="rounded-lg border border-line bg-bg px-2 py-2"><option value="">{t("çdo", "any")}</option>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></td>
                      <td className="py-2 pr-3 text-ink-2 tabular-nums">{available ? formatNumber(available, 1) : t("s'ka", "none")}</td>
                      <td className="py-2 text-right"><button type="button" onClick={() => removeReq(r.id)} className="rounded-lg px-2 py-1 text-ink-2 hover:bg-bg-2 hover:text-ink" aria-label={t(`Hiq ${r.text}`, `Remove ${r.text}`)}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addReq} className="btn-ghost mt-4">{t("Shto rresht", "Add row")}</button>
        </section>
      )}

      {plan && (
        <section aria-labelledby="planet" className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="planet" className="text-3xl">{t("Tre kombinime blerjeje", "Three purchasing options")}</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={readAloud}>{t("Lexo me zë", "Read aloud")}</button>
              <button type="button" className="btn-ghost" onClick={exportCsv}>{t("Shkarko CSV", "Download CSV")}</button>
              <button type="button" className="btn-primary" onClick={save}>{projectId ? t("Ruaj ndryshimet", "Save changes") : t("Ruaj projektin", "Save project")}</button>
            </div>
          </div>
          <div role="tablist" aria-label={t("Kombinimet", "Options")} className="grid gap-3 md:grid-cols-3">
            {plans.map((p) => (
              <button key={p.mode} role="tab" aria-selected={active === p.mode} onClick={() => setActive(p.mode)}
                className={`rounded-card border p-5 text-left transition ${active === p.mode ? "border-lime bg-card shadow-[0_0_0_3px_rgba(15,74,67,0.12)]" : "border-line bg-card/60 hover:border-lime/50"}`}>
                <span className="flex items-center justify-between"><span className="text-lg font-semibold">{MODE_LABEL[lang][p.mode]}</span>{p.remainingLek !== undefined && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.remainingLek >= 0 ? "bg-accent text-lime" : "bg-[#fde8e4] text-[#8a2f1d]"}`}>{p.remainingLek >= 0 ? t("brenda buxhetit", "within budget") : t("mbi buxhet", "over budget")}</span>}</span>
                <span className="mt-1 block text-sm text-ink-2">{MODE_TEXT[lang][p.mode]}</span>
                <span className="display mt-4 block text-4xl tabular-nums">{lek(p.totalLek)}</span>
                <span className="mt-1 block text-xs text-ink-2">{p.sellers} {t("shitës", "sellers")} · {Math.round(p.reuseShare * 100)}% {t("ripërdorim", "reuse")}{p.missing.length ? ` · ${p.missing.length} ${t("mungojnë", "missing")}` : ""}</span>
              </button>
            ))}
          </div>

          <div role="tabpanel" className="card p-5 md:p-7">
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-6">
              <Stat label={t("Materiale", "Materials")} value={lek(plan.materialLek)} />
              <Stat label={t("Transport (vlerësim)", "Transport (estimate)")} value={lek(plan.transportLek)} />
              <Stat label={t("Totali", "Total")} value={lek(plan.totalLek)} strong />
              <Stat label={t("Buxheti mbetur", "Budget left")} value={plan.remainingLek !== undefined ? lek(plan.remainingLek) : "–"} />
              <Stat label={t("Kursimi ndaj çmimit të ri", "Saving vs new price")} value={lek(plan.savingLek)} />
              <Stat label={t("CO₂ e shmangur (vlerësim)", "CO₂ avoided (estimate)")} value={`${formatNumber(plan.co2AvoidedKg, 0)} kg`} />
            </dl>
            <p aria-live="polite" className="sr-only">{`${MODE_LABEL[lang][plan.mode]}: ${lek(plan.totalLek)}`}</p>

            <div className="mt-6 grid gap-3">
              {state.requirements.map((r) => {
                const lines = plan.lines.filter((l) => l.requirementId === r.id);
                const miss = plan.missing.find((m) => m.requirementId === r.id);
                const alternatives = candidatesFor(r, listings).filter((l) => !state.excluded.includes(l.id));
                return (
                  <article key={r.id} className="rounded-xl border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">{formatNumber(r.quantity, 1)} {r.unit ?? ""} · {r.text || categoryLabel(r.category, lang)}</h3>
                      {alternatives.length > 1 && (
                        <label className="flex items-center gap-2 text-sm text-ink-2">{t("Zgjidh tjetër", "Choose another")}
                          <select value={state.pinned[r.id] ?? ""} onChange={(e) => setState((s) => ({ ...s, pinned: { ...s.pinned, [r.id]: e.target.value } }))} className="max-w-64 rounded-lg border border-line bg-bg px-2 py-1.5 text-ink">
                            <option value="">{t("automatikisht", "automatic")}</option>
                            {alternatives.map((l) => <option key={l.id} value={l.id}>{l.title} · {lek(l.priceLek)}/{l.unit} · {l.city}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                    <ul className="mt-3 grid gap-2">
                      {lines.map((l) => (
                        <li key={l.listing.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-bg-2/60 px-3 py-2.5 text-sm">
                          <span className="min-w-0 flex-1">
                            <span className="font-medium">{l.listing.title}</span>{" "}
                            <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-ink-2">{CONDITION_LABEL[lang][l.listing.condition]}</span>
                            {l.listing.source === "demo" && <span className="ml-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-2">{t("demo", "demo")}</span>}
                            <span className="block text-xs text-ink-2">{l.listing.sellerName}, {l.listing.city} · {formatNumber(l.distanceKm, 0)} km</span>
                          </span>
                          <span className="tabular-nums">{formatNumber(l.take, 1)} {l.listing.unit} × {lek(l.listing.priceLek)}</span>
                          <span className="w-24 text-right font-semibold tabular-nums">{lek(l.costLek)}</span>
                          <span className="flex gap-2">
                            {l.listing.href
                              ? <Link href={`${l.listing.href}/oferte`} className="rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-bg">{t("Kërko ofertë", "Request quote")}</Link>
                              : <span className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-2" title={t("Listim demonstrues", "Demo listing")}>{t("S'porositet", "Not orderable")}</span>}
                            <button type="button" onClick={() => setState((s) => ({ ...s, excluded: [...s.excluded, l.listing.id] }))} className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-lime">{t("Hiq", "Remove")}</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {miss && <p className="mt-2 text-sm text-[#8a4b12]">{t("Mungojnë", "Missing")} {formatNumber(miss.quantity, 1)} {miss.unit ?? ""}: {miss.reason}. {t("Duhet të sigurohen veçmas.", "Source them separately.")}</p>}
                  </article>
                );
              })}
            </div>
            {state.excluded.length > 0 && <button type="button" onClick={() => setState((s) => ({ ...s, excluded: [] }))} className="mt-4 text-sm text-ink-2 underline underline-offset-4">{t("Rikthe ofertat e hequra", "Restore removed offers")}</button>}
            <p className="mt-6 text-xs leading-relaxed text-ink-2">
              {t(`Transporti është vlerësim: 1,500 L për çdo shitës + 60 L/km. Euro konvertohen me 1 € = ${EUR_TO_LEK} L. Kursimi llogaritet vetëm ku ka çmim reference. CO₂ sipas faktorëve ICE v3, vlerësim.`,
                `Transport is an estimate: 1,500 L per seller + 60 L/km. Euros converted at 1 € = ${EUR_TO_LEK} L. Savings only where a reference price exists. CO₂ from ICE v3 factors, an estimate.`)}
              {plan.usesDemo && ` ${t("Ofertat me etiketën \"demo\" janë shembuj dhe nuk mund të porositen.", "Offers tagged \"demo\" are examples and cannot be ordered.")}`}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div><dt className="text-xs text-ink-2">{label}</dt><dd className={`mt-1 tabular-nums ${strong ? "text-xl font-semibold" : "text-lg"}`}>{value}</dd></div>;
}

export function SourceBadge({ live, connected }: { live: number; connected: boolean }) {
  const { t } = useLang();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-2 px-3 py-1 text-xs text-ink-2">
      <span className={`size-1.5 rounded-full ${live ? "bg-[#7fb52a]" : "bg-ink-2/50"}`} />
      {connected ? t(`${live} listime reale në treg + shembuj demo`, `${live} real listings + demo examples`) : t("Vetëm shembuj demo (databaza s'është lidhur)", "Demo examples only (database not connected)")}
    </span>
  );
}
