"use client";

import { useLang } from "@/components/lang-provider";
import { useSpeechInput } from "./speech";

export function MicButton({ onText, className = "" }: { onText: (text: string, final: boolean) => void; className?: string }) {
  const { lang, t } = useLang();
  const { listening, start, stop, error, supported } = useSpeechInput(lang, onText);
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={listening ? stop : start} aria-pressed={listening} disabled={!supported}
        aria-label={listening ? t("Ndalo dëgjimin", "Stop listening") : t("Fol", "Speak")}
        title={supported ? undefined : t("Ky shfletues nuk e mbështet njohjen e zërit", "This browser does not support speech input")}
        className={`grid size-11 shrink-0 place-items-center rounded-full border transition ${listening ? "animate-pulse border-lime bg-lime text-bg" : "border-line bg-card text-ink hover:border-lime"} disabled:opacity-40 ${className}`}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><rect x="6.5" y="1.75" width="5" height="9" rx="2.5" /><path d="M3.5 8.5a5.5 5.5 0 0 0 11 0M9 14v2.5" /></svg>
      </button>
      <span role="status" className="sr-only">{listening ? t("Duke dëgjuar", "Listening") : ""}</span>
      {error && error !== "aborted" && <span className="text-xs text-ink-2">{error === "not-allowed" ? t("Lejo mikrofonin në shfletues.", "Allow the microphone in your browser.") : error === "unsupported" ? t("Njohja e zërit nuk mbështetet këtu.", "Speech input is not supported here.") : t("Zëri nuk u kap. Provo përsëri.", "Could not hear you. Try again.")}</span>}
    </span>
  );
}
