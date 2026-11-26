import Link from "next/link";

/** Compact layout shared by the legal and policy pages: title, date, plain sections, related links. */
export function LegalPage({ title, lead, updated, sections, related }: { title: string; lead: string; updated: string; sections: [string, React.ReactNode][]; related: [string, string][] }) {
  return (
    <article className="container-x max-w-3xl py-12 md:py-16">
      <h1 className="display text-[clamp(2rem,4vw,3rem)] leading-tight">{title}</h1>
      <p className="mt-3 text-ink-2">{lead}</p>
      <p className="mt-2 text-xs text-ink-2">{updated}</p>
      <div className="mt-10 grid gap-8">
        {sections.map(([h, body]) => (
          <section key={h}><h2 className="text-lg font-semibold">{h}</h2><div className="mt-2 leading-relaxed text-ink-2 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">{body}</div></section>
        ))}
      </div>
      <nav className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6" aria-label="Related">
        {related.map(([href, label]) => <Link key={href} href={href} className="rounded-full border border-line px-3.5 py-1.5 text-sm hover:border-lime">{label}</Link>)}
      </nav>
    </article>
  );
}
