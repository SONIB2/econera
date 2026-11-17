import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { readCatalogue } from "@/lib/catalogue";
import { conditions, fulfillment, priceLabel } from "@/lib/data";
import { findMasonryType, masonryTypes } from "@/lib/masonry";

export const metadata = { title: "Studio e muraturës" };
export const dynamic = "force-dynamic";

export default async function MasonryPage({ searchParams }: { searchParams: Promise<{ tipi?: string; page?: string }> }) {
  const { tipi, page } = await searchParams;
  const material = findMasonryType(tipi) ?? masonryTypes[0];
  const stock = await readCatalogue({ category: "guri", masonry: material.id, page }, 6);
  const typeLink = (id: string, number = 1) => `/materiale/murature?tipi=${id}${number > 1 ? `&page=${number}#stoku` : ""}`;

  return <div className="masonry-page">
    <header className="container studio-head">
      <Link href="/?scene=masonry" className="text-link"><ArrowLeft size={16} aria-hidden /> Eksploruesi</Link>
      <h1>Studio e muraturës</h1>
      <p>Zgjidh tipin dhe krahaso materialet e publikuara.</p>
    </header>
    <section className="container studio-layout" aria-label="Përzgjedhja e muraturës">
      <figure className="studio-image">
        <div><Image key={material.id} src={`/masonry/${material.id}.webp`} alt={`Mur ilustrues prej ${material.name.toLocaleLowerCase("sq")}`} fill preload sizes="(max-width: 830px) 100vw, 64vw" /></div>
        <figcaption>Pamje ilustruese. Përmasat, ngjyra dhe vetitë varen nga materiali i listuar.</figcaption>
      </figure>
      <div className="studio-controls">
        <nav aria-label="Tipet e muraturës">
          {masonryTypes.map(({ id, name }) => <Link key={id} href={typeLink(id)} scroll={false} aria-current={material.id === id ? "page" : undefined}>
            {name}<ArrowRight aria-hidden size={17} />
          </Link>)}
        </nav>
        <div className="studio-spec" aria-live="polite">
          <p className="eyebrow">{material.tag}</p><h2>{material.name}</h2>
          <p>{material.description}</p>
          <h3>Çfarë të kontrollosh në ofertë</h3>
          <ul>{material.checks.map((check) => <li key={check}>{check}</li>)}</ul>
        </div>
      </div>
    </section>
    <section id="stoku" className="container studio-results" aria-labelledby="studio-stock">
      <div className="studio-results-head"><h2 id="studio-stock">Stoku i publikuar</h2><Link className="text-link" href="/materiale?category=guri">E gjithë muratura <ArrowRight aria-hidden size={16} /></Link></div>
      {stock.kind === "ready" && stock.items.length > 0 ? <ul className="studio-stock-list">
        {stock.items.map((item) => <li key={item.id}>
          <div><h3><Link href={`/materiale/${item.id}`}>{item.title}</Link></h3><p>{item.seller_label || "Shitësi pa emër publik"} · {conditions[item.condition]}</p></div>
          <div><p><MapPin aria-hidden size={15} /> {item.region} · {fulfillment[item.fulfillment]}</p><p>{item.quantity} {item.unit} në dispozicion</p></div>
          <div><strong>{priceLabel(item.unit_price, item.currency)} / {item.unit}</strong><Link className="text-link" href={`/materiale/${item.id}/oferte`}>Kërko ofertë <ArrowRight aria-hidden size={16} /></Link></div>
        </li>)}
      </ul> : stock.kind === "ready" ? <div className="panel stack"><p>Nuk ka stok të publikuar për këtë tip murature.</p><Link className="text-link" href="/disponueshmeria?category=guri">Kërko disponueshmëri <ArrowRight aria-hidden size={16} /></Link></div>
      : <p className="panel">Stoku nuk mund të ngarkohet. Provo përsëri pas pak.</p>}
      {stock.kind === "ready" && (stock.filters.page > 1 || (stock.more && stock.filters.page < 1000)) && <nav className="actions pagination" aria-label="Faqet e stokut">
        {stock.filters.page > 1 && <Link className="button secondary" href={typeLink(material.id, stock.filters.page - 1)}>Faqja e mëparshme</Link>}
        {stock.more && stock.filters.page < 1000 && <Link className="button secondary" href={typeLink(material.id, stock.filters.page + 1)}>Faqja tjetër</Link>}
      </nav>}
    </section>
  </div>;
}
