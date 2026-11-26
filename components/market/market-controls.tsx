"use client";

import { useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";

/** Mobile: filters open in a bottom sheet (native <dialog>: focus trap, Esc to close). Desktop shows the sidebar instead. */
export function FilterDrawer({ count, children }: { count: number; children: React.ReactNode }) {
  const { t } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-semibold lg:hidden">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        {t("Filtrat", "Filters")}{count > 0 && <span className="grid size-5 place-items-center rounded-full bg-lime text-[11px] text-bg">{count}</span>}
      </button>
      <dialog ref={ref} aria-label={t("Filtro rezultatet", "Filter results")} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-[1.75rem] border-0 bg-card p-0 text-ink backdrop:bg-black/50 lg:hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-5 py-4">
          <p className="text-lg font-semibold">{t("Filtro rezultatet", "Filter results")}</p>
          <button type="button" onClick={() => ref.current?.close()} aria-label={t("Mbyll", "Close")} className="grid size-9 place-items-center rounded-full border border-line">✕</button>
        </div>
        <div className="px-5 pt-4 pb-8">{children}</div>
      </dialog>
    </>
  );
}

/** Sort selector that applies immediately (the form still works without JavaScript via its submit button). */
export function SortSelect({ name, value, options, label }: { name: string; value: string; options: [string, string][]; label: string }) {
  const [v, setV] = useState(value);
  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      <span className="max-sm:sr-only">{label}</span>
      <select name={name} value={v} onChange={(e) => { setV(e.target.value); e.target.form?.requestSubmit(); }}
        className="rounded-full border border-line bg-card py-2 pr-8 pl-3 text-sm font-semibold text-ink">
        {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  );
}
