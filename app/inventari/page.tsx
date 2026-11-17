import Link from "next/link";
import { Plus } from "lucide-react";
import { signOut } from "@/app/account-actions";
import { changeMaterialState } from "@/app/inventari/actions";
import { Empty, Field, Notice, PageIntro } from "@/components/ui";
import { inventoryColumns } from "@/lib/catalogue";
import { categoryName, priceLabel, type InventoryEntry } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

function label(item: InventoryEntry) {
  if (item.publication === "archived") return "Arkivuar";
  if (item.publication === "published") return "Publikuar";
  if (item.moderation === "pending") return "Në shqyrtim";
  if (item.moderation === "rejected") return "Kërkon ndryshime";
  return "Skicë";
}

export default async function Inventory({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string; publication?: string }> }) {
  const { db, user } = await requireAccount();
  const { status, q, page, publication } = await searchParams;
  const state = publication === "draft" || publication === "published" || publication === "archived" ? publication : "";
  const keyword = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const current = Number(page);
  const index = Number.isInteger(current) && current > 0 && current <= 1000 ? current : 1;
  const limit = 24;
  const offset = (index - 1) * limit;
  let query = db.from("materials").select(inventoryColumns).eq("owner_id", user.id);
  if (state) query = query.eq("publication", state);
  if (keyword) query = query.ilike("title", `%${keyword.replace(/[\\%_*]/g, "\\$&")}%`);
  const [{ data, error }, { data: admin }] = await Promise.all([
    query.order("updated_at", { ascending: false }).order("id").range(offset, offset + limit).returns<InventoryEntry[]>(),
    db.rpc("is_platform_admin"),
  ]);
  const hasFilters = Boolean(keyword || state);
  const pageLink = (number: number) => `/inventari?${new URLSearchParams({ q: keyword, publication: state, page: String(number) })}`;

  return <div className="container section">
    <div className="workspace-head">
    <PageIntro eyebrow="HAPËSIRA E PUNËS" title="Inventari yt">Ruaj skicat dhe ndiq gjendjen e materialeve të tua.</PageIntro>
    <Notice status={status} />
    <div className="actions">
      <Link href="/paneli">Paneli</Link>
      <Link className="button" href="/inventari/i-ri"><Plus size={18} aria-hidden /> Material i ri</Link>
      {admin === true && <Link className="button secondary" href="/administrim">Moderimi</Link>}
      <Link href="/inventari/profili">Profili yt</Link>
      <Link href="/disponueshmeria">Kërkesat për materiale</Link>
      <Link href="/inventari/ofertat">Kërkesat për ofertë</Link>
      <Link href="/fjalekalimi/ndrysho">Ndrysho fjalëkalimin</Link>
      <form action={signOut}><button className="button secondary">Dil nga llogaria</button></form>
    </div>
    </div>
    <form className="panel inventory-filters" action="/inventari" role="search">
      <Field label="Kërko në inventar"><input name="q" maxLength={80} defaultValue={keyword} /></Field>
      <Field label="Gjendja e publikimit"><select name="publication" defaultValue={state}>
        <option value="">Të gjitha</option><option value="draft">Të papublikuara</option>
        <option value="published">Të publikuara</option><option value="archived">Të arkivuara</option>
      </select></Field>
      <button className="button secondary">Kërko</button>
      {hasFilters && <Link href="/inventari">Hiq filtrat</Link>}
    </form>
    <div className="inventory-grid">
      {error && <Empty title="Inventari nuk u ngarkua" href="/inventari" label="Provo përsëri">Materialet nuk mund të lexohen për momentin.</Empty>}
      {!error && data?.length === 0 && <Empty title="Nuk u gjetën materiale" href={hasFilters ? "/inventari" : "/inventari/i-ri"} label={hasFilters ? "Hiq filtrat" : "Shto një material"}>{hasFilters ? "Provo të ndryshosh titullin ose gjendjen e publikimit." : "Përgatit skicën e parë dhe dërgoje për shqyrtim kur të jetë gati."}</Empty>}
      {data?.slice(0, limit).map((item) => <article className="panel inventory-row" key={item.id}>
        <div className="stack"><span className="pill">{label(item)}</span><h2 className="row-title">{item.title}</h2>
          <p>{categoryName(item.category)} · {item.region} · {item.quantity} {item.unit}</p><p className="muted">{priceLabel(item.unit_price, item.currency)} / {item.unit}</p>
        </div>
        <div className="actions">
          {item.publication !== "archived" && <>
            <Link className="button secondary" href={`/inventari/${item.id}`} aria-label={`Ndrysho: ${item.title}`}>Ndrysho</Link>
            <form action={changeMaterialState} className="actions">
              <input type="hidden" name="id" value={item.id} /><input type="hidden" name="revision" value={item.revision} />
              {item.publication === "draft" && item.moderation !== "pending" && item.quantity > 0 && <button className="button" name="intent" value="submit">Dërgo për shqyrtim</button>}
              {(item.publication === "published" || item.moderation === "pending") && <button className="button secondary" name="intent" value="unpublish">Tërhiq</button>}
              <button className="button secondary" name="intent" value="archive">Arkivo</button>
            </form>
          </>}
          {item.publication === "published" && item.quantity > 0 && <Link href={`/materiale/${item.id}`}>Shiko në katalog</Link>}
        </div>
      </article>)}
    </div>
    {!error && (index > 1 || (data && data.length > limit && index < 1000)) && <nav className="actions pagination" aria-label="Faqet e inventarit">
      {index > 1 && <Link className="button secondary" href={pageLink(index - 1)}>Faqja e mëparshme</Link>}
      <span>Faqja {index}</span>
      {data && data.length > limit && index < 1000 && <Link className="button secondary" href={pageLink(index + 1)}>Faqja tjetër</Link>}
    </nav>}
  </div>;
}
