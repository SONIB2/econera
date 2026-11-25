"use client";

import { useState } from "react";
import { useLang } from "@/components/lang-provider";

type Result = { summary?: string; suggested_risk?: string; risk_reason?: string; inconsistencies?: string[]; missing_information?: string[]; questions_for_seller?: string[]; caution?: string; error?: string };

/** Staff-only AI pre-screen. Output is clearly preliminary and has no effect on status. */
export function AiScreen({ materialId }: { materialId: string }) {
  const { lang, t } = useLang();
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<Result | null>(null);
  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/prescreen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: materialId, lang }) });
      setR(await res.json());
    } catch { setR({ error: "upstream" }); } finally { setBusy(false); }
  }
  const list = (title: string, items?: string[]) => items?.length ? <div className="mt-2"><p className="font-medium">{title}</p><ul className="list-disc pl-5">{items.map((x) => <li key={x}>{x}</li>)}</ul></div> : null;
  return (
    <div className="mt-4 border-t border-line pt-4">
      <button type="button" onClick={run} disabled={busy} className="btn-ghost">{busy ? t("Duke analizuar…", "Analysing…") : t("Analizë paraprake me AI", "AI preliminary analysis")}</button>
      {r?.error && <p className="mt-2 text-sm text-ink-2">{r.error === "not-configured" ? t("AI nuk është aktive (mungon ANTHROPIC_API_KEY).", "AI is not active (ANTHROPIC_API_KEY missing).") : t("Analiza nuk u krye.", "The analysis failed.")}</p>}
      {r && !r.error && (
        <div className="mt-3 rounded-xl border border-dashed border-line p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a5a12]">{t("Paraprake · kërkon vlerësim njerëzor", "Preliminary · needs human validation")}</p>
          <p className="mt-2">{r.summary}</p>
          {r.suggested_risk && <p className="mt-2"><span className="font-medium">{t("Rrezik i sugjeruar", "Suggested risk")}:</span> {r.suggested_risk} · {r.risk_reason}</p>}
          {list(t("Mospërputhje", "Inconsistencies"), r.inconsistencies)}
          {list(t("Informacion që mungon", "Missing information"), r.missing_information)}
          {list(t("Pyetje për shitësin", "Questions for the seller"), r.questions_for_seller)}
          {r.caution && <p className="mt-2 text-xs text-ink-2">{r.caution}</p>}
        </div>
      )}
    </div>
  );
}
