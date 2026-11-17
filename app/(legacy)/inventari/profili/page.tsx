import Link from "next/link";
import { Empty, Field, Notice, PageIntro } from "@/components/ui";
import { regions } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";
import { saveProfile } from "./actions";

export const metadata = { title: "Profili yt" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { db, user } = await requireAccount();
  const { data, error } = await db.from("profiles").select("display_name,region").eq("user_id", user.id).maybeSingle();

  return <div className="container narrow section">
    <PageIntro eyebrow="LLOGARIA" title="Profili yt">Këto të dhëna mbeten private në llogarinë tënde.</PageIntro>
    <Notice status={(await searchParams).status} />
    {error ? <Empty title="Profili nuk u ngarkua" href="/inventari/profili" label="Provo përsëri">Provo përsëri pas pak.</Empty> :
      <form action={saveProfile} className="panel stack">
        <Field label="Emri i profilit"><input name="display_name" defaultValue={data?.display_name} autoComplete="name" required minLength={2} maxLength={80} /></Field>
        <Field label="Qarku (opsional)"><select name="region" defaultValue={data?.region ?? ""}><option value="">Pa përzgjedhje</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></Field>
        <div className="actions"><button className="button">Ruaj profilin</button><Link href="/inventari">Kthehu te inventari</Link></div>
      </form>}
  </div>;
}
