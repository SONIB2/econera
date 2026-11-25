import { MaterialForm } from "@/components/material-form";
import { Notice, PageIntro } from "@/components/ui";
import { requireAccount } from "@/lib/supabase";
import type { InventoryEntry } from "@/lib/data";

export const metadata = { title: "Material i ri" };
type Draft = { status?: string; titulli?: string; pershkrimi?: string; sasia?: string; njesia?: string; cmimi?: string; monedha?: string; qarku?: string; gjendja?: string };

export default async function NewMaterial({ searchParams }: { searchParams: Promise<Draft> }) {
  await requireAccount();
  const p = await searchParams;
  const draft = p.titulli ? {
    title: p.titulli.slice(0, 100), description: p.pershkrimi?.slice(0, 2000), quantity: Number(p.sasia) || undefined, unit: p.njesia,
    unit_price: Number(p.cmimi) || undefined, currency: p.monedha === "EUR" ? "EUR" : "ALL", region: p.qarku, condition: p.gjendja === "reusable" ? "reusable" : "unused",
  } as Partial<InventoryEntry> : undefined;
  return <div className="container narrow section">
    <PageIntro eyebrow="INVENTARI" title="Material i ri">Plotëso të dhënat dhe ruaje materialin si skicë private.</PageIntro>
    {draft && <p className="notice" role="status">Të dhënat u plotësuan nga asistenti. Kontrollo çdo fushë, shto foto dhe ruaje vetë.</p>}
    <Notice status={p.status} />
    <MaterialForm draft={draft} />
  </div>;
}
