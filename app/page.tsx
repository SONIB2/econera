import { redirect } from "next/navigation";
import { ImmersiveWorld } from "@/components/immersive-world";
import { readCatalogue } from "@/lib/catalogue";
import type { SearchParams } from "@/lib/data";
import { findMasonryType, masonryTypes, type MasonryType } from "@/lib/masonry";
import { readPavilion } from "@/lib/pavilion";
import { worldDestination } from "@/lib/world-state";
import "./world.css";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  if (params.material || params.drita || params.catia || params.kendi) {
    const pavilion = readPavilion(params);
    const query = new URLSearchParams({ material: pavilion.finish.id, drita: pavilion.light.id, catia: pavilion.roof.id, kendi: String(pavilion.angle) });
    redirect(`/tregimi?${query}#pavijoni`);
  }
  const initial = worldDestination(params.scene);
  const entries = await Promise.all(masonryTypes.map(async ({ id }) => {
    const result = await readCatalogue({ category: "guri", masonry: id }, 3);
    return [id, result.kind === "ready" ? { kind: "ready" as const, items: result.items } : { kind: result.kind }] as const;
  }));
  const stock = Object.fromEntries(entries) as Record<MasonryType, typeof entries[number][1]>;
  return <ImmersiveWorld locale={params.lang === "en" ? "en" : "sq"} initial={initial} initialKind={findMasonryType(params.tipi)?.id ?? "clay"} stock={stock} />;
}
