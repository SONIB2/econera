"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/lang-provider";

/** Shown when WebGL is unavailable. Same message, drawn as a static blueprint. */
export function StaticFallback() {
  const { t } = useLang();
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg text-ink">
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(var(--color-ink)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="container-x relative grid min-h-dvh items-center gap-12 py-20 lg:grid-cols-2">
        <div>
          <Image src="/brand/logo-dark.svg" alt="ECONERA" width={481} height={66} className="h-7 w-auto" priority />
          <h1 className="display mt-10 text-5xl md:text-7xl">{t("Ndërtimi takon inteligjencën.", "Construction meets intelligence.")}</h1>
          <p className="lead mt-6 max-w-lg">{t("Tregu online ku materialet e tepërta të ndërtimit gjejnë projektin e radhës, me AI.", "The online market where surplus construction materials find their next project, with AI.")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/treg" className="btn-primary">{t("Shiko tregun", "Browse the market")}</Link>
            <Link href="/ai" className="btn-ghost">{t("Provo AI-n", "Try the AI")}</Link>
          </div>
          <p className="mt-6 text-xs text-ink-2">{t("Shfletuesi juaj nuk mbështet 3D. Ky është versioni statik.", "Your browser does not support 3D. This is the static version.")}</p>
        </div>
        <svg viewBox="0 0 320 300" className="mx-auto w-full max-w-md" fill="none" stroke="currentColor" aria-hidden="true">
          <g className="text-ink/60" strokeWidth="1">
            <path d="M60 280V200h160v80M50 200V110h190v90M80 110V50h110v60M60 230h160M50 155h190M80 80h110" />
            {[90, 120, 150, 180, 210].map((x) => <path key={x} d={`M${x} 110v90`} />)}
            {[100, 125, 150, 175].map((x) => <path key={x} d={`M${x} 50v60`} />)}
          </g>
          <path d="M126 280v-46h28v46" className="text-lime" strokeWidth="1.5" />
          <g className="text-lime" strokeWidth="1.5">
            <path d="M135 50V20M135 32l-16-14M135 32l18-16M135 24l-8-14M135 24l10-12" />
            {[[119, 18], [153, 16], [127, 10], [145, 12], [135, 20]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="currentColor" />)}
          </g>
        </svg>
      </div>
    </div>
  );
}
