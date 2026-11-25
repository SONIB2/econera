export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_15%_-10%,rgba(200,241,105,0.28),transparent_60%),radial-gradient(40rem_24rem_at_95%_10%,rgba(15,74,67,0.08),transparent_60%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--color-ink)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-x relative py-20 md:py-28">
        <p className="eyebrow-pill">{eyebrow}</p>
        <h1 className="display mt-5 max-w-4xl text-5xl md:text-7xl">{title}</h1>
        {lead && <p className="lead mt-6 max-w-2xl">{lead}</p>}
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}

/** Placeholder shown on pages whose content arrives in a later phase. */
export function ComingNext({ phase, items }: { phase: string; items: string[] }) {
  return (
    <section className="container-x py-16 md:py-20">
      <div className="card p-8 md:p-10">
        <span className="demo-badge"><span className="size-1.5 rounded-full bg-lime" />{phase}</span>
        <ul className="mt-6 grid gap-3 text-ink-2 sm:grid-cols-2">
          {items.map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-lime" />{item}</li>)}
        </ul>
      </div>
    </section>
  );
}
