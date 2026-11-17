import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, Field, Notice, PageIntro } from "@/components/ui";
import { readMaterial } from "@/lib/catalogue";
import { fulfillment, priceLabel, uuid } from "@/lib/data";
import { sessionDatabase } from "@/lib/supabase";
import { requestQuotation } from "./actions";

export const metadata = { title: "Kërko ofertë", robots: { index: false, follow: false } };

export default async function QuotationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const result = await readMaterial(id);
  if (result.kind === "missing") notFound();
  if (result.kind !== "ready") return <div className="container narrow section"><Empty title="Materiali nuk u ngarkua" href="/materiale" label="Kthehu te katalogu">Provo përsëri pas pak.</Empty></div>;
  const { material } = result;
  const db = await sessionDatabase();
  const user = db ? (await db.auth.getUser()).data.user : null;
  const own = user?.email_confirmed_at && db ? await db.from("materials").select("id").eq("owner_id", user.id).eq("id", id).maybeSingle() : null;
  const options = material.fulfillment === "both" ? ["pickup", "delivery"] as const : [material.fulfillment];

  return <div className="container narrow section">
    <PageIntro eyebrow="KËRKESË PËR OFERTË" title={material.title}>{material.quantity} {material.unit} në dispozicion · {priceLabel(material.unit_price, material.currency)} / {material.unit} · {material.region}</PageIntro>
    <Notice status={(await searchParams).status} />
    {own?.data ? <div className="panel stack"><p>Ky material është në inventarin tënd.</p><Link className="text-link" href="/inventari/ofertat">Shiko kërkesat e marra</Link></div>
    : user?.email_confirmed_at ? <form action={requestQuotation} className="panel stack">
      <input type="hidden" name="listing" value={id} />
      <Field label={`Sasia (${material.unit})`}><input name="quantity" inputMode="decimal" required maxLength={12} pattern="[0-9]{1,8}([.,][0-9]{1,3})?" /></Field>
      <Field label="Marrja e materialit"><select name="fulfillment" required>{options.map((option) => <option key={option} value={option}>{fulfillment[option]}</option>)}</select></Field>
      <Field label="Mesazh për shitësin"><textarea name="message" required minLength={10} maxLength={1000} placeholder="P.sh. afati, përmasat ose dokumentacioni që të nevojitet." /></Field>
      <p>Kërkesa i shfaqet shitësit. Sasia nuk rezervohet dhe nuk krijohet porosi.</p>
      <div className="actions"><button className="button">Dërgo kërkesën</button><Link href={`/materiale/${id}`}>Kthehu te materiali</Link></div>
    </form> : <div className="panel stack"><p>Hyr në llogari për t’i dërguar një kërkesë shitësit.</p><Link className="button" href={`/hyr?quotation=${id}`}>Hyr për të vazhduar</Link></div>}
  </div>;
}
