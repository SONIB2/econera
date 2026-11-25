import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { Empty, PageIntro } from "@/components/ui";
import { readMaterial } from "@/lib/catalogue";
import { categoryName, conditions, fulfillment, priceLabel, uuid } from "@/lib/data";
import { findMasonryType } from "@/lib/masonry";
import { readVerification } from "@/lib/verify/public";

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
  // The redesigned product page lives at /treg/[id]; this legacy route forwards there.
  if (process.env.LEGACY_PRODUCT_PAGE !== "1") redirect(`/treg/${id}`);
  const verification = (await readVerification(id).catch(() => null))?.v;
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
      {verification && <section aria-labelledby="verify" style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem" }}>
        <h2 id="verify">ECONERA Verify{verification.passport_code ? ` · ${verification.passport_code}` : ""}</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".35rem" }}>
          <li>{verification.identity_verified || verification.business_verified ? "✓" : "–"} {verification.business_verified ? "Biznes i verifikuar" : verification.identity_verified ? "Identitet i verifikuar" : "Shitësi nuk është verifikuar ende"}</li>
          <li>✓ Listim i shqyrtuar dhe miratuar nga një person i autorizuar</li>
          <li>{verification.documents.length ? "✓ Dokumentet e produktit u shqyrtuan" : "– Pa dokumente teknike të shqyrtuara"}</li>
          <li>{verification.inspection ? `✓ Inspektuar fizikisht (${verification.inspection.result})` : "– Inspektim fizik: nuk është kryer"}</li>
        </ul>
        {verification.known_defects && <p><strong>Defekte të njohura:</strong> {verification.known_defects}</p>}
        <p><Link href={`/verifikim/${id}`} className="text-link">Shiko detajet e verifikimit</Link> · <Link href={`/mbrojtja?material=${id}`} className="text-link">Raporto një problem</Link></p>
      </section>}
      <div className="actions">
        <Link href={`/materiale/${id}/oferte`} className="button">Kërko ofertë</Link>
        <Link href={masonry ? `/materiale/murature?tipi=${masonry.id}` : "/materiale"} className="text-link">{masonry ? "Kthehu te studioja" : "Kthehu te katalogu"}</Link>
      </div>
    </div>
  </div>;
}
