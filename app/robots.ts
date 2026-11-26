import type { MetadataRoute } from "next";
import { applicationOrigin, isPreview } from "@/lib/deployment";

export default function robots(): MetadataRoute.Robots {
  if (isPreview()) return { rules: { userAgent: "*", disallow: "/" } };
  const origin = applicationOrigin();
  return { rules: { userAgent: "*", disallow: ["/admin", "/paneli", "/inventari", "/administrim", "/disponueshmeria", "/autentikim", "/fjalekalimi", "/hyr", "/regjistrohu", "/verifikimi", "/shporta", "/ruajtura", "/projektet", "/njoftimet", "/mbrojtja", "/api/"] }, sitemap: origin ? `${origin}/sitemap.xml` : undefined };
}
