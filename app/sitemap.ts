import type { MetadataRoute } from "next";
import { applicationOrigin, isPreview } from "@/lib/deployment";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = applicationOrigin();
  if (!origin || isPreview()) return [];
  const languages = { sq: new URL("/sq/platform", origin).href, en: new URL("/en/platform", origin).href };
  return [
    ...["/", "/materiale", "/aksesueshmeria"].map((route) => ({ url: new URL(route, origin).href })),
    ...Object.values(languages).map((url) => ({ url, alternates: { languages } })),
  ];
}
