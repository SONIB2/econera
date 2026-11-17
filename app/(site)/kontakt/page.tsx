import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Lista e pritjes", description: "Regjistrohu si furnitor ose kontraktor për pilotin e ECONERA në Tiranë." };

export default function KontaktPage() {
  return (
    <>
      <PageHero eyebrow="Lista e pritjes" title="Bëhu pjesë e pilotit." lead="20 furnitorë dhe 10 kontraktorë në Tiranë, në 12 muajt e parë. Na trego çfarë materialesh ke ose kërkon." />
      <ComingNext phase="Vjen në Fazën E" items={["Kompania, NIPT (opsional), roli dhe qyteti", "Materialet që ke ose kërkon", "Pëlqim GDPR", "Ruajtje në databazë dhe eksport CSV te /admin"]} />
    </>
  );
}
