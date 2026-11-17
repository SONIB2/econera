import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Për furnitorët", description: "Shit stokun e tepërt. Regjistrim falas, me foto dhe AI." };

export default function FurnitorePage() {
  return (
    <>
      <PageHero eyebrow="Për furnitorët" title={<>Stoku juaj i tepërt<br />ka një blerës.</>} lead="Materialet e tepërta nuk shihen, nuk shiten dhe degradohen. Me ECONERA i regjistroni falas, me foto dhe AI." />
      <ComingNext phase="Vjen në Fazën E" items={["Si funksionon për depot dhe furnitorët", "Skano depon me AI", "Formular interesi për pilotin në Tiranë", "Pëlqim GDPR dhe ruajtje e sigurt"]} />
    </>
  );
}
