"use client";

import { useState } from "react";
import { co2Factors, co2Source, stock } from "@/lib/demo";
import { certificateFigures, certificateNumber, fmt } from "@/lib/certificate";
import { formatDate } from "@/lib/format";
import { CATEGORIES } from "@/lib/market";
import { DEMO_TITLE_EN, unitLabel } from "@/lib/market/i18n";
import { useLang } from "@/components/lang-provider";

const CATEGORY_EN: Record<string, string> = {
  tulla: "Bricks and blocks", cimento: "Cement", hekur: "Rebar", agregat: "Sand and aggregate", suva: "Plaster", pllaka: "Tiles", parket: "Wood flooring",
  dritare: "Windows", dyer: "Doors", boje: "Paint", sanitari: "Sanitary ware", elektrike: "Electrical", hidraulike: "Plumbing", izolim: "Insulation", cati: "Roofing",
};

const items = stock.filter((s) => co2Factors[s.category]?.kgPerUnit[s.unit]);

export function CertificateBuilder() {
  const [itemId, setItemId] = useState("tulla-vrima-25x12");
  const { lang, t } = useLang();
  const en = lang === "en";
  const item = items.find((i) => i.id === itemId) ?? items[0];
  const title = (i: { id: string; title: string }) => (en ? DEMO_TITLE_EN[i.id] ?? i.title : i.title);
  const unit = unitLabel(item.unit, lang, true);
  const [quantity, setQuantity] = useState(600);
  const [busy, setBusy] = useState(false);
  const input = { category: item.category, label: item.title, quantity, unit: item.unit };
  const label = title(item);
  const figures = certificateFigures(input);
  const number = certificateNumber(input);
  const date = formatDate(new Date());

  async function download() {
    setBusy(true);
    try {
      const { certificatePdf } = await import("./pdf");
      const bytes = await certificatePdf({ number, label, quantity, unit, ...figures, date, source: co2Source }, lang);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `${number}.pdf` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-x grid gap-8 py-12 lg:grid-cols-[380px_1fr]">
      <form className="card grid content-start gap-5 p-6" onSubmit={(e) => e.preventDefault()}>
        <p className="eyebrow">{t("1 · Materiali", "1 · Material")}</p>
        <label className="grid gap-1.5 text-sm">{t("Zgjidh nga stoku", "Choose from stock")}
          <select value={itemId} onChange={(e) => { setItemId(e.target.value); }} className="h-12 rounded-xl border border-line bg-bg-2 px-3 text-ink focus:border-lime focus:outline-none">
            {CATEGORIES.map((c) => {
              const group = items.filter((i) => i.category === c.id);
              return group.length ? <optgroup key={c.id} label={en ? CATEGORY_EN[c.id] ?? c.label : c.label}>{group.map((i) => <option key={i.id} value={i.id}>{title(i)}</option>)}</optgroup> : null;
            })}
          </select>
        </label>
        <p className="eyebrow mt-2">{t("2 · Sasia", "2 · Quantity")}</p>
        <label className="grid gap-1.5 text-sm">{t("Sasia", "Quantity")} ({unit})
          <input type="number" min={1} max={1000000} step="any" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
            className="h-12 rounded-xl border border-line bg-bg-2 px-4 text-ink focus:border-lime focus:outline-none" />
        </label>
        <p className="text-xs leading-relaxed text-ink-2">{t("Metoda: ripërdorimi zëvendëson të njëjtën masë materiali të ri. Masa për njësi dhe faktori i CO₂ janë vlerësime", "Method: reuse replaces the same mass of new material. Mass per unit and the CO₂ factor are estimates")} ({co2Source.split(".")[0]}).</p>
      </form>

      <div>
        <article className="relative overflow-hidden rounded-card border border-line bg-bg-2 p-8 md:p-12" aria-labelledby="cert-title">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-ink)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4"><p className="font-semibold tracking-wide">ECONERA</p><p className="font-mono text-sm text-lime">{number}</p></div>
            <p className="eyebrow mt-12">{t("Certifikatë e gjelbër", "Green certificate")}</p>
            <h2 id="cert-title" className="display mt-4 text-4xl md:text-5xl">{t("Materiale të ripërdorura,", "Reused materials,")}<br />{t("ndikim i matshëm.", "measurable impact.")}</h2>
            <p className="mt-4 text-ink-2">{fmt(quantity)} {unit} · {label}</p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="card p-6"><p className="display text-5xl text-lime tabular-nums">−{fmt(figures.co2Kg / 1000, 2)} t</p><p className="mt-2 text-sm">{t("CO₂e e shmangur (vlerësim)", "CO₂e avoided (estimate)")}</p></div>
              <div className="card p-6"><p className="display text-5xl text-lime tabular-nums">{fmt(figures.massKg / 1000, 2)} t</p><p className="mt-2 text-sm">{t("mbetje të shmangura", "waste avoided")}</p></div>
            </div>
            <dl className="mt-8 grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-ink-2">{t("Data", "Date")}</dt><dd>{date}</dd></div>
              <div><dt className="text-ink-2">{t("Masa për njësi", "Mass per unit")}</dt><dd>{fmt(figures.kgPerUnit, 2)} kg</dd></div>
              <div><dt className="text-ink-2">{t("Faktori", "Factor")}</dt><dd>{fmt(figures.factor, 3)} kg CO₂e/kg</dd></div>
            </dl>
            <p className="mt-8 text-xs text-ink-2">{t("Shembull demonstrues. Shifrat janë vlerësime, jo matje e certifikuar.", "Demonstration example. Figures are estimates, not a certified measurement.")}</p>
          </div>
        </article>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={download} disabled={busy || quantity <= 0} className="btn-primary h-12 px-6 disabled:opacity-60">{busy ? t("Duke përgatitur…", "Preparing…") : t("Shkarko PDF", "Download PDF")}</button>
          <span className="demo-badge">{t("Të dhëna demonstruese", "Demonstration data")}</span>
        </div>
      </div>
    </div>
  );
}
