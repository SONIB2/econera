import type { Metadata } from "next";
import { SavedView } from "@/components/market/saved-view";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default async function SavedPage() {
  const lang = await getLang();
  return (
    <div className="container-x max-w-3xl pt-10 pb-20">
      <h1 className="display text-4xl md:text-5xl">{tr(lang, "Të ruajturat", "Saved materials")}</h1>
      <p className="mt-3 text-ink-2">{tr(lang, "Ruhen në këtë shfletues.", "Kept in this browser.")}</p>
      <div className="mt-8"><SavedView /></div>
    </div>
  );
}
