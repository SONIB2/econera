"use client";

import { useLang } from "@/components/lang-provider";
import "./(site)/site.css";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLang();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div className="max-w-md">
        <h1 className="display text-4xl">{t("Faqja nuk u ngarkua.", "This page could not load.")}</h1>
        <p className="lead mt-4">{t("Provo përsëri. Nëse problemi vazhdon, na shkruaj nga faqja e kontaktit.", "Please try again. If it keeps happening, tell us through the contact page.")}</p>
        <button type="button" className="btn-primary mt-8" onClick={reset}>{t("Provo përsëri", "Try again")}</button>
      </div>
    </main>
  );
}
