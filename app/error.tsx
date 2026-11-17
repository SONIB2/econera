"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="container section"><h1>Faqja nuk u ngarkua</h1><p>Provo përsëri. Nëse problemi vazhdon, kthehu më vonë.</p><button className="button" onClick={reset}>Provo përsëri</button></div>;
}
