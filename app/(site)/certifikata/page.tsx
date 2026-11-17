import type { Metadata } from "next";
import { ComingNext, PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Certifikata e gjelbër", description: "CO₂ e kursyer dhe mbetjet e shmangura për çdo porosi me materiale të ripërdorura." };

export default function CertifikataPage() {
  return (
    <>
      <PageHero eyebrow="Certifikatë e gjelbër" title="CO₂ e kursyer për çdo porosi." lead="Zgjedh materialin dhe sasinë. Merr CO₂ e kursyer dhe mbetjet e shmangura, në një certifikatë që vlen për tendera." />
      <ComingNext phase="Vjen në Fazën E" items={["Zgjedhja e materialit dhe sasisë", "Llogaritja e CO₂ të kursyer dhe e mbetjeve të shmangura", "Faktorë CO₂ me burim të cituar", "Shkarkim në PDF"]} />
    </>
  );
}
