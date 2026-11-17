import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Rreth nesh", description: "Platforma është ndërtuar nga vetë ekipi. Sonila Balla dhe Rey Sylaj." };

export default function RrethNeshPage() {
  return (
    <>
      <PageHero eyebrow="Ekipi" title={<>Platforma është ndërtuar<br />nga vetë ekipi.</>} lead="Themeluesit nuk marrin pagë nga granti. Çdo lek shkon te produkti dhe piloti." />
      <ComingNext phase="Vjen në Fazën E" items={["Misioni: fiton mjedisi, fiton biznesi", "Ndikimi: OZhQ 9, 11 dhe 12", "Sonila Balla, Themeluese · CEO & CTO", "Rey Sylaj, Bashkëthemelues"]} />
    </>
  );
}
