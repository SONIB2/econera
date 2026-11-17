import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "AI", description: "Plan → preventiv, Skano depon dhe Asistenti ECONERA. AI propozon, njeriu konfirmon." };

export default function AiPage() {
  return (
    <>
      <PageHero eyebrow="Inovacioni · AI" title="Tre gjëra që tregu shqiptar nuk i ka." lead="AI propozon, njeriu konfirmon. Asnjë porosi pa miratim." />
      <ComingNext phase="Vjen në Fazën F" items={["Plan → preventiv: ngarkon planimetrinë, AI nxjerr listën e materialeve", "Skano depon: fotografon stokun, AI e kthen në inventar", "Asistenti ECONERA: “Më duhen 600 tulla në Tiranë”", "Pasiguria shfaqet gjithmonë, me konfirmim njerëzor"]} />
    </>
  );
}
