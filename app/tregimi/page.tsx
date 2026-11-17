import { ArrowRight, Search } from "lucide-react";
import { ConstructionStory } from "@/components/construction-story";
import { Explorer, type ZoneStock } from "@/components/explorer";
import { PavilionBuilder } from "@/components/pavilion-builder";
import { readCatalogue } from "@/lib/catalogue";
import { zones } from "@/lib/explorer";
import { readPavilion } from "@/lib/pavilion";
import "../home.css";
import "../story.css";

export const dynamic = "force-dynamic";

export default async function StoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const pavilion = readPavilion(await searchParams);
  const stock = await Promise.all(zones.map(async ({ category }): Promise<ZoneStock> => {
    const result = await readCatalogue({ category }, 3);
    return result.kind === "ready" ? { kind: "ready", items: result.items } : { kind: result.kind };
  }));
  return <div className="home-cinema">
    <ConstructionStory />
    <PavilionBuilder key={`${pavilion.finish.id}:${pavilion.light.id}:${pavilion.roof.id}:${pavilion.angle}`} initial={pavilion} />
    <Explorer stock={stock} />
    <section className="container discovery-strip" aria-labelledby="discovery-title">
      <h2 id="discovery-title">E di çfarë kërkon?</h2>
      <form action="/materiale" className="hero-search" role="search">
        <Search size={19} aria-hidden />
        <label className="sr-only" htmlFor="hero-query">Kërko materiale</label>
        <input id="hero-query" name="q" maxLength={80} placeholder="P.sh. pllaka, parket, gur..." />
        <button type="submit" className="button">Kërko <ArrowRight size={17} aria-hidden /></button>
      </form>
    </section>
  </div>;
}
