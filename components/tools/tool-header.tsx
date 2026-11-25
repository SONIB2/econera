import Link from "next/link";

/** Compact page head for the AI tools: path back to the hub, title, one-line purpose. */
export function ToolHeader({ hub, name, title, lead, note }: { hub: string; name: string; title: string; lead: string; note?: string }) {
  return (
    <header className="container-x pt-12 pb-8 md:pt-16">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2">
        <Link href="/ai" className="hover:text-ink">{hub}</Link><span aria-hidden className="mx-2">/</span><span className="text-ink">{name}</span>
      </nav>
      <h1 className="display mt-4 max-w-4xl text-4xl md:text-6xl">{title}</h1>
      <p className="lead mt-4 max-w-2xl">{lead}</p>
      {note && <p className="mt-3 max-w-2xl text-sm text-ink-2">{note}</p>}
    </header>
  );
}
