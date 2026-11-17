import Link from "next/link";
import { Field, Notice, PageIntro } from "@/components/ui";
import { categories, categoryName, materialCategory, regions } from "@/lib/data";
import { sessionDatabase } from "@/lib/supabase";
import { saveAvailabilityRequest } from "./actions";

export const metadata = { title: "Kërko disponueshmëri", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ category?: string; status?: string }> }) {
  const { category, status } = await searchParams;
  const selected = materialCategory.safeParse(category).data;
  const db = await sessionDatabase();
  const auth = db ? await db.auth.getUser() : null;
  const user = auth?.data.user?.email_confirmed_at ? auth.data.user : null;
  const saved = db && user ? await db.from("availability_requests").select("id,category,region,details").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(20) : null;
  const login = `/hyr?${new URLSearchParams({ availability: selected ?? "all" })}`;

  return <div className="container narrow section">
    <PageIntro eyebrow="ZBULIMI I MATERIALEVE" title="Kërko disponueshmëri">Ruaj çfarë të nevojitet për projektin. Kërkesa mbetet private në llogarinë tënde.</PageIntro>
    <Notice status={status} />
    {user ? <form className="panel stack" action={saveAvailabilityRequest}>
      <Field label="Kategoria"><select name="category" required defaultValue={selected ?? ""}><option value="" disabled>Zgjidh një kategori</option>{categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}</select></Field>
      <Field label="Qarku (opsional)"><select name="region" defaultValue=""><option value="">Çdo qark</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></Field>
      <Field label="Çfarë të nevojitet?"><textarea name="details" required minLength={10} maxLength={600} placeholder="Përshkruaj sasinë, përmasat dhe afatin." /></Field>
      <button className="button">Ruaj kërkesën</button>
    </form> : <div className="panel stack"><p>Hyr për të ruajtur një kërkesë në llogarinë tënde.</p><Link className="button" href={login}>Hyr për të vazhduar</Link></div>}
    {saved?.error && <p className="notice" role="status">Kërkesat nuk u ngarkuan.</p>}
    {saved?.data && saved.data.length > 0 && <section className="section">
      <h2>Kërkesat e ruajtura</h2>
      <div className="inventory-grid">{saved.data.map((item) => <article className="panel stack" key={item.id}><h3>{categoryName(item.category)}</h3>{item.region && <p>{item.region}</p>}<p className="preserve">{item.details}</p></article>)}</div>
    </section>}
  </div>;
}
