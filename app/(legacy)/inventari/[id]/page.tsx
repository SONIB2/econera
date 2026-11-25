import { notFound } from "next/navigation";
import { MaterialForm } from "@/components/material-form";
import { Empty, Notice, PageIntro } from "@/components/ui";
import { inventoryColumns } from "@/lib/catalogue";
import { uuid, type InventoryEntry } from "@/lib/data";
import { requireAccount } from "@/lib/supabase";

export const metadata = { title: "Ndrysho materialin" };
export default async function EditMaterial({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const { db, user } = await requireAccount();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  // Verification and offcut columns exist after migrations 0007/0008; fall back to the base columns before that.
  const extended = `${inventoryColumns},intended_use,manufacturer,model_ref,batch_no,origin_country,age_years,storage_conditions,known_defects,sourcing,length_mm,width_mm,thickness_mm,sheet_material,color`;
  const first = await db.from("materials").select(extended).eq("id", id).eq("owner_id", user.id).neq("publication", "archived").maybeSingle<InventoryEntry>();
  const { data, error } = first.error ? await db.from("materials").select(inventoryColumns).eq("id", id).eq("owner_id", user.id).neq("publication", "archived").maybeSingle<InventoryEntry>() : first;
  if (error) return <div className="container narrow section"><h1>Ndrysho materialin</h1><Empty title="Materiali nuk u ngarkua" href="/inventari" label="Kthehu te inventari">Provo përsëri pas pak.</Empty></div>;
  if (!data) notFound();
  return <div className="container narrow section">
    <PageIntro eyebrow="INVENTARI" title="Ndrysho materialin">{data.title}</PageIntro>
    <Notice status={(await searchParams).status} />
    <MaterialForm item={data} />
  </div>;
}
