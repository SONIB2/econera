import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Empty, Field, PageIntro } from "@/components/ui";
import { readCatalogue } from "@/lib/catalogue";
import { categories, categoryName, conditions, currencies, priceLabel, regions, units, type SearchParams } from "@/lib/data";

export const metadata = { title: "Katalogu i materialeve" };

export default async function Catalogue({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const result = await readCatalogue(await searchParams);
  const { filters } = result;
  function pageLink(page: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, page })) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }
    return `/materiale?${query}`;
  }

  return <div className="container section">
    <div className="catalogue-head">
      <PageIntro eyebrow="ZBULIMI I MATERIALEVE" title={filters.category ? categoryName(filters.category) : "Katalogu"}>Gjej materiale ndërtimi nga qarqet e Shqipërisë dhe krahaso sasinë e disponueshme, gjendjen dhe çmimin për njësi.</PageIntro>
      <Link className="text-link" href="/bota?scene=house">Kthehu te Eksploruesi <ArrowRight size={16} aria-hidden /></Link>
    </div>
    {filters.category === "guri" && <div className="studio-catalogue-link"><Link href="/materiale/murature" className="button">Hap studion e muraturës <ArrowRight size={16} aria-hidden /></Link></div>}
    <form action="/materiale" className="panel form-grid filters" aria-label="Filtro katalogun">
      <Field label="Titulli"><input name="q" defaultValue={filters.q} maxLength={80} placeholder="P.sh. Parket" /></Field>
      <Field label="Kategoria"><select name="category" defaultValue={filters.category ?? ""}><option value="">Të gjitha</option>{categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}</select></Field>
      <Field label="Qarku"><select name="region" defaultValue={filters.region ?? ""}><option value="">Të gjitha</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></Field>
      <Field label="Gjendja"><select name="condition" defaultValue={filters.condition ?? ""}><option value="">Të gjitha</option>{Object.entries(conditions).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
      <Field label="Njësia"><select name="unit" defaultValue={filters.unit ?? ""}><option value="">Të gjitha</option>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></Field>
      <Field label="Sasia minimale"><input name="minQuantity" inputMode="decimal" pattern="[0-9]{1,8}([.,][0-9]{1,3})?" defaultValue={filters.minQuantity} /></Field>
      <Field label="Monedha"><select name="currency" defaultValue={filters.currency ?? ""}><option value="">Të gjitha</option>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></Field>
      <Field label="Çmimi maksimal për njësi"><input name="maxPrice" inputMode="decimal" pattern="[0-9]{1,8}([.,][0-9]{1,2})?" defaultValue={filters.maxPrice} aria-describedby="price-hint" /></Field>
      <Field label="Renditja"><select name="sort" defaultValue={filters.sort}><option value="recent">Më të fundit</option><option value="price_asc">Çmimi në rritje</option><option value="price_desc">Çmimi në zbritje</option></select></Field>
      <p className="span muted" id="price-hint">Zgjidh monedhën për të filtruar ose renditur sipas çmimit. Zgjidh njësinë për të krahasuar sasi të të njëjtit lloj.</p>
      <div className="span actions"><button className="button">Zbato filtrat</button><Link href="/materiale">Pastro filtrat</Link></div>
    </form>
    {result.kind === "unavailable" && <Empty title="Katalogu nuk është i lidhur ende">Shfaqja e materialeve kërkon lidhjen e bazës së të dhënave.</Empty>}
    {result.kind === "error" && <Empty title="Katalogu nuk u ngarkua" href={pageLink(filters.page)} label="Provo përsëri">Materialet nuk mund të lexohen për momentin.</Empty>}
    {result.kind === "ready" && (result.items.length > 0 ?
      <div className="material-grid">{result.items.map((item) => <article className="material-card" key={item.id}>
        <p className="eyebrow">{categoryName(item.category)}</p>
        <h2><Link href={`/materiale/${item.id}`}>{item.title}</Link></h2>
        <div className="meta"><span><MapPin size={15} aria-hidden /> {item.region}</span><span>{conditions[item.condition]}</span></div>
        <p className="description">{item.description}</p>
        <p className="price">{priceLabel(item.unit_price, item.currency)} / {item.unit}</p>
        <p>{item.quantity} {item.unit} në dispozicion</p>
        <Link className="text-link" href={`/materiale/${item.id}`} aria-label={`Shiko materialin: ${item.title}`}>Shiko materialin <ArrowRight size={16} aria-hidden /></Link>
      </article>)}</div> : <div className="stack"><Empty title="Nuk u gjetën materiale" href="/materiale" label="Hiq filtrat">Katalogu shfaq materiale të miratuara dhe me sasi të disponueshme.</Empty>
        <Link className="text-link" href={filters.category ? `/disponueshmeria?category=${filters.category}` : "/disponueshmeria"}>Kërko disponueshmëri <ArrowRight size={16} aria-hidden /></Link>
      </div>)}
    {result.kind === "ready" && (filters.page > 1 || result.more) && <nav className="actions pagination" aria-label="Faqet e katalogut">
      {filters.page > 1 && <Link className="button secondary" href={pageLink(filters.page - 1)}>Faqja e mëparshme</Link>}
      <span>Faqja {filters.page}</span>
      {result.more && filters.page < 1000 && <Link className="button secondary" href={pageLink(filters.page + 1)}>Faqja tjetër</Link>}
    </nav>}
  </div>;
}
