import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Empty, PageIntro } from "@/components/ui";
import { readMaterial } from "@/lib/catalogue";
import { categoryName, conditions, fulfillment, priceLabel, uuid } from "@/lib/data";
import { findMasonryType } from "@/lib/masonry";

const load = cache(readMaterial);
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (uuid.safeParse(id).success) {
    const result = await load(id);
    if (result.kind === "ready") return { title: result.material.title, description: result.material.description.slice(0, 160) };
  }
  return { title: "Materiali", robots: { index: false } };
}

export default async function MaterialDetail({ params }: Props) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const result = await load(id);
  if (result.kind === "missing") notFound();
  if (result.kind !== "ready") {
    return <div className="container section"><h1>Materiali</h1><Empty title="Materiali nuk u ngarkua" href="/materiale" label="Kthehu te katalogu">Të dhënat nuk janë të disponueshme për momentin.</Empty></div>;
  }
  const material = result.material;
  const masonry = findMasonryType(material.masonry_type);
  const facts = [
    ["Qarku", material.region],
    ["Gjendja", conditions[material.condition]],
    ["Sasia në dispozicion", `${material.quantity} ${material.unit}`],
    ["Çmimi për njësi", priceLabel(material.unit_price, material.currency)],
    ["Marrja e materialit", fulfillment[material.fulfillment]],
    ["Shitësi", material.seller_label || "Pa emër publik"],
    ...(masonry ? [["Tipi i muraturës", masonry.name]] : []),
  ];
  return <div className="container narrow section">
    <PageIntro eyebrow={categoryName(material.category)} title={material.title} />
    <div className="panel stack">
      <dl className="definition-list">{facts.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      <h2>Përshkrimi</h2><p className="preserve">{material.description}</p>
      <div className="actions">
        <Link href={`/materiale/${id}/oferte`} className="button">Kërko ofertë</Link>
        <Link href={masonry ? `/materiale/murature?tipi=${masonry.id}` : "/materiale"} className="text-link">{masonry ? "Kthehu te studioja" : "Kthehu te katalogu"}</Link>
      </div>
    </div>
  </div>;
}
