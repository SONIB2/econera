import { MaterialForm } from "@/components/material-form";
import { Notice, PageIntro } from "@/components/ui";
import { requireAccount } from "@/lib/supabase";

export const metadata = { title: "Material i ri" };
export default async function NewMaterial({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAccount();
  return <div className="container narrow section">
    <PageIntro eyebrow="INVENTARI" title="Material i ri">Plotëso të dhënat dhe ruaje materialin si skicë private.</PageIntro>
    <Notice status={(await searchParams).status} />
    <MaterialForm />
  </div>;
}
