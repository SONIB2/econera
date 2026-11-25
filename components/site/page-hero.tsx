export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative -mt-[76px] overflow-hidden pt-[76px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_15%_-10%,rgba(200,241,105,0.30),transparent_60%),radial-gradient(50rem_26rem_at_85%_0%,rgba(15,74,67,0.10),transparent_60%),radial-gradient(70rem_20rem_at_50%_120%,rgba(255,255,255,0.9),transparent_70%)]" />
      <div className="container-x relative flex flex-col items-center pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <p className="eyebrow-pill">{eyebrow}</p>
        <h1 className="display mt-6 max-w-5xl text-[2.9rem] sm:text-6xl md:text-[5.25rem]">{title}</h1>
        {lead && <p className="lead mt-6 max-w-2xl text-balance">{lead}</p>}
        {children && <div className="mt-10 flex justify-center [&>div]:justify-center">{children}</div>}
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
