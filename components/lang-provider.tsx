"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";
import { LANG_COOKIE, tr, type Lang } from "@/lib/lang";

function rememberLang(next: Lang) {
  document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = next;
}

const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  const lang = useContext(LangContext);
  return { lang, t: (sq: string, en: string) => tr(lang, sq, en) };
}

/** SQ | EN switch. Stores the choice for a year and re-renders the server components. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang } = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (next: Lang) => {
    if (next === lang) return;
    rememberLang(next);
    start(() => router.refresh());
  };
  return (
    <div role="radiogroup" aria-label={lang === "en" ? "Language" : "Gjuha"} className={`inline-flex h-11 items-center rounded-full border border-line bg-bg/60 p-1 text-xs font-semibold backdrop-blur ${pending ? "opacity-60" : ""} ${className}`}>
      {(["sq", "en"] as const).map((l) => (
        <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => set(l)}
          className={`h-full rounded-full px-3 uppercase transition ${lang === l ? "bg-lime text-bg" : "text-ink-2 hover:text-ink"}`}>{l === "sq" ? "SQ" : "EN"}</button>
      ))}
    </div>
  );
}
