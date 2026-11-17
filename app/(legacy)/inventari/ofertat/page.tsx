import Link from "next/link";
import { Empty, Notice, PageIntro } from "@/components/ui";
import { fulfillment } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

export const metadata = { title: "Kërkesat për ofertë" };

export default async function Quotations({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { db, user } = await requireAccount();
  const { data, error } = await db.from("quotation_requests")
    .select("id,material_title,buyer_id,seller_id,quantity,unit,fulfillment,message,created_at")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50);

  return <div className="container section">
    <PageIntro eyebrow="HAPËSIRA E PUNËS" title="Kërkesat për ofertë">Kërkesat që ke dërguar ose marrë për materiale të publikuara.</PageIntro>
    <Notice status={(await searchParams).status} />
    <Link href="/inventari" className="text-link">Kthehu te inventari</Link>
    <div className="inventory-grid">
      {error ? <Empty title="Kërkesat nuk u ngarkuan" href="/inventari/ofertat" label="Provo përsëri">Provo përsëri pas pak.</Empty>
      : data?.length === 0 ? <Empty title="Nuk ka kërkesa për ofertë">Kërkesat shfaqen këtu pasi dërgohen.</Empty>
      : data?.map((request) => <article className="panel stack" key={request.id}>
        <p className="eyebrow">{request.buyer_id === user.id ? "DËRGUAR" : "MARRË"}</p>
        <h2 className="row-title">{request.material_title}</h2>
        <p>{request.quantity} {request.unit} · {fulfillment[request.fulfillment as "pickup" | "delivery"]}</p>
        <p className="preserve">{request.message}</p>
      </article>)}
    </div>
  </div>;
}
