import type { Metadata } from "next";
import { CertificateBuilder } from "@/components/certificate/certificate-builder";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Certifikata e gjelbër", description: "CO₂ e kursyer dhe mbetjet e shmangura për çdo porosi me materiale të ripërdorura, me shkarkim PDF." };

export default function CertifikataPage() {
  return (
    <>
      <PageHero eyebrow="Certifikatë e gjelbër" title="CO₂ e kursyer për çdo porosi." lead="Zgjedh materialin dhe sasinë. Merr CO₂ e shmangur dhe mbetjet e shmangura, në një certifikatë që vlen për tendera." />
      <CertificateBuilder />
    </>
  );
}
