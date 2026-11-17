import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Privatësia", description: "Si i mbledh dhe i mbron ECONERA të dhënat personale." };

export default function PrivatesiaPage() {
  return (
    <>
      <PageHero eyebrow="Privatësia · GDPR" title="Të dhënat tuaja, të mbrojtura." lead="Mbledhim vetëm atë që duhet për pilotin dhe nuk ia shesim askujt." />
      <ComingNext phase="Vjen në Fazën G" items={["Çfarë të dhënash mbledhim dhe pse", "Sa kohë i ruajmë", "Të drejtat tuaja: qasje, korrigjim, fshirje", "Kontakti për privatësinë"]} />
    </>
  );
}
