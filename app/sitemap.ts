import type { MetadataRoute } from "next";
import { applicationOrigin, isPreview } from "@/lib/deployment";
import { liveMarket } from "@/lib/market/live";

export const revalidate = 3600;

const PAGES = ["/", "/treg", "/shit", "/biznes", "/cmimet", "/ai", "/ai/shporta", "/ai/smartcut", "/ai/renovim", "/verify", "/certifikata", "/furnitore",
  "/partneret", "/rreth-nesh", "/kontakt", "/privatesia", "/kushtet", "/cookies", "/qasshmeria", "/materiale"];

/** Public pages plus every approved live listing; demo examples, drafts and private areas are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = applicationOrigin();
  if (!origin || isPreview()) return [];
  const languages = { sq: new URL("/sq/platform", origin).href, en: new URL("/en/platform", origin).href };
  const listings = await liveMarket().then((m) => m.items.filter((i) => i.source === "live")).catch(() => []);
  return [
    ...PAGES.map((route) => ({ url: new URL(route, origin).href })),
    ...listings.map((i) => ({ url: new URL(`/treg/${i.id}`, origin).href, lastModified: i.createdAt })),
    ...Object.values(languages).map((url) => ({ url, alternates: { languages } })),
  ];
}
