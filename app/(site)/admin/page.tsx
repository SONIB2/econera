import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <>
      <PageHero eyebrow="Admin" title="Regjistrimet e interesit." />
      <ComingNext phase="Vjen në Fazën E" items={["Hyrje me fjalëkalim", "Lista e regjistrimeve nga /kontakt dhe /furnitore", "Eksport në CSV"]} />
    </>
  );
}
