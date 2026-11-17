"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Plus } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { priceLabel, type CatalogueEntry } from "@/lib/data";
import { zones } from "@/lib/explorer";

export type ZoneStock = { kind: "ready"; items: CatalogueEntry[] } | { kind: "error" | "unavailable" };

export function Explorer({ stock }: { stock: ZoneStock[] }) {
  const [selected, select] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const zone = zones[selected];
  const current = stock[selected];
  function selectZone(index: number) {
    setEngaged(true);
    select(index);
  }

  return <section id="eksploruesi" aria-labelledby="explorer-title" className="explorer-section home-atlas">
    <div className="container explorer-layout">
      <header className="explorer-intro">
        <p className="eyebrow">EKSPLORUESI I NDËRTIMIT</p>
        <h2 id="explorer-title">Shiko përtej fasadës.</h2>
        <p>Zgjidh një pjesë të ndërtesës për të parë materialet dhe stokun e publikuar.</p>
      </header>

      <div className="explorer-stage">
      <div className="scene" data-engaged={engaged} style={{ "--zone-x": `${zone.x}%`, "--zone-y": `${zone.y}%` } as CSSProperties}>
        <Image src="/construction-explorer.webp" alt="Prerje aksonometrike e një shtëpie me mure tulle, parket, themel betoni, vetrata dhe çati me tjegulla" fill sizes="(max-width: 820px) 100vw, 66vw" />
        <div className="scene-spotlight" aria-hidden="true" />
        {zones.map((item, index) => <button key={item.category} type="button" className="hotspot" aria-label={`Eksploro ${item.title}`}
          aria-pressed={selected === index} aria-controls="zone-panel" onClick={() => selectZone(index)} style={{ left: `${item.x}%`, top: `${item.y}%` }}>
          <Plus aria-hidden size={19} />
        </button>)}
      </div>

      <nav id="pjeset" className="zone-nav" aria-label="Pjesët e ndërtesës">
        {zones.map((item, index) => <button key={item.category} type="button" aria-pressed={selected === index} aria-controls="zone-panel" onClick={() => selectZone(index)}>{item.part}</button>)}
      </nav>
      </div>

      <section id="zone-panel" className="zone-panel" aria-labelledby="zone-title">
        <div className="zone-story">
          <h2 id="zone-title" aria-live="polite">{zone.title}</h2>
          <p>{zone.description}</p>
          <ul className="zone-examples" aria-label="Shembuj të materialeve">{zone.examples.map((example) => <li key={example}>{example}</li>)}</ul>
        </div>
        <div className="zone-stock">
          <h3>Stoku i publikuar</h3>
          {current.kind === "ready" && current.items.length > 0 && <ul className="stock-list">
            {current.items.map((item) => <li key={item.id}><Link href={`/materiale/${item.id}`}>{item.title}</Link><span><MapPin size={14} aria-hidden /> {item.region} · {item.quantity} {item.unit} · {priceLabel(item.unit_price, item.currency)}/{item.unit}</span></li>)}
          </ul>}
          {current.kind === "ready" && current.items.length === 0 && <p>Aktualisht nuk ka materiale të publikuara në këtë kategori.</p>}
          {current.kind !== "ready" && <p>Stoku nuk mund të ngarkohet për momentin.</p>}
          <div className="actions">
            {zone.category === "guri" && <Link href="/materiale/murature" className="button">Hap studion e muraturës <ArrowRight size={16} aria-hidden /></Link>}
            <Link href={`/materiale?category=${zone.category}`} className="text-link">Hap katalogun <ArrowRight size={16} aria-hidden /></Link>
            {current.kind === "ready" && <Link href={`/disponueshmeria?category=${zone.category}`} className="button secondary">Kërko disponueshmëri</Link>}
          </div>
        </div>
      </section>
    </div>
  </section>;
}
