import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Tregu", description: "Kërkon një herë. Gjen stokun më afër: materiale të tepërta ndërtimi me çmim, vend dhe përputhje nga AI." };

export default function TregPage() {
  return (
    <>
      <PageHero eyebrow="Tregu" title={<>Kërkon një herë.<br />Gjen stokun më afër.</>} lead="Stok i tepërt nga depo, furnitorë dhe kantiere, me çmim, distancë dhe përputhje nga AI." />
      <ComingNext phase="Vjen në Fazën E" items={["Kërkim dhe filtra sipas materialit, qytetit dhe gjendjes", "Harta me furnitorët në Tiranë, Durrës, Shkodër dhe Vlorë", "Përqindja e përputhjes nga AI për çdo rezultat", "Kursimi i vlerësuar kundrejt çmimit të tregut"]} />
    </>
  );
}
