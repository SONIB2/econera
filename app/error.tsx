"use client";

import "./(site)/site.css";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div className="max-w-md">
        <h1 className="display text-4xl">Faqja nuk u ngarkua.</h1>
        <p className="lead mt-4">Provo përsëri. Nëse problemi vazhdon, kthehu më vonë.</p>
        <button type="button" className="btn-primary mt-8" onClick={reset}>Provo përsëri</button>
      </div>
    </main>
  );
}
