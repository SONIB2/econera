import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewMaterial } from "@/app/(legacy)/administrim/actions";
import { Empty, Notice, PageIntro } from "@/components/ui";
import { inventoryColumns } from "@/lib/catalogue";
import { categoryName, conditions, fulfillment, priceLabel, type InventoryEntry } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";
import { findMasonryType } from "@/lib/masonry";

export const metadata = { title: "Moderimi i materialeve", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { db } = await requireAccount();
  const { data: admin } = await db.rpc("is_platform_admin");
  if (admin !== true) notFound();
  const { data, error } = await db.from("materials").select(inventoryColumns).eq("moderation", "pending").order("updated_at").order("id").limit(30).returns<InventoryEntry[]>();
  return <div className="container section">
    <PageIntro eyebrow="ADMINISTRIMI" title="Moderimi i materialeve">Shqyrto deri në 30 kërkesat më të vjetra. Për materiale strukturore, elektrike ose me rrezik tjetër, kërko dokumentacion dhe vlerësim specialisti para publikimit.</PageIntro>
    <Notice status={(await searchParams).status} />
    <Link href="/inventari">Kthehu te inventari</Link>
    <div className="inventory-grid">
      {error && <Empty title="Kërkesat nuk u ngarkuan" href="/administrim" label="Provo përsëri">Provo përsëri pas pak.</Empty>}
      {data?.length === 0 && <Empty title="Nuk ka materiale në pritje">Materialet shfaqen këtu pasi dërgohen për shqyrtim.</Empty>}
      {data?.map((item) => <article className="panel stack" key={item.id}>
        <h2 className="row-title">{item.title}</h2>
        <p>{categoryName(item.category)} · {item.region} · {conditions[item.condition]} · {fulfillment[item.fulfillment]}</p>
        <p>{item.quantity} {item.unit} · {priceLabel(item.unit_price, item.currency)} / {item.unit}</p>
        {item.seller_label && <p>Emri publik i shitësit: {item.seller_label}</p>}
        {item.masonry_type && <p>Tipi i muraturës: {findMasonryType(item.masonry_type)?.name}</p>}
        <p className="preserve">{item.description}</p>
        <form action={reviewMaterial} className="actions">
          <input type="hidden" name="id" value={item.id} /><input type="hidden" name="revision" value={item.revision} />
          <button className="button" name="verdict" value="approved">Mirato dhe publiko</button>
          <button className="button secondary" name="verdict" value="rejected">Refuzo</button>
        </form>
      </article>)}
    </div>
  </div>;
}
