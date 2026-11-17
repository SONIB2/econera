import type { MetadataRoute } from "next";
import { applicationOrigin } from "@/lib/supabase";

export default function robots(): MetadataRoute.Robots {
  if (process.env.ECONERA_PREVIEW === "1") return { rules: { userAgent: "*", disallow: "/" } };
  const origin = applicationOrigin();
  return { rules: { userAgent: "*", disallow: ["/paneli", "/inventari", "/administrim", "/disponueshmeria", "/autentikim", "/fjalekalimi", "/hyr", "/regjistrohu"] }, sitemap: origin ? `${origin}/sitemap.xml` : undefined };
}
