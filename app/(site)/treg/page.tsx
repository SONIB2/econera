import type { Metadata } from "next";
import { Market } from "@/components/market/market";
import { PageHero } from "@/components/site/page-hero";
import { CATEGORIES, CITIES, type City } from "@/lib/market";

export const metadata: Metadata = { title: "Tregu", description: "Kërkon një herë. Gjen stokun më afër: materiale të tepërta ndërtimi me çmim, vend dhe përputhje nga AI." };

export default async function TregPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const category = CATEGORIES.some((c) => c.id === one(params.kategoria)) ? one(params.kategoria) : "";
  const city = (one(params.qyteti) in CITIES ? one(params.qyteti) : "Tiranë") as City;
  return (
    <>
      <PageHero eyebrow="Tregu" title={<>Kërkon një herë.<br />Gjen stokun më afër.</>} lead="Stok i tepërt nga depo, furnitorë dhe kantiere, me çmim, distancë dhe përputhje." />
      <Market initialQuery={one(params.q).slice(0, 120)} initialCategory={category} initialCity={city} />
    </>
  );
}
