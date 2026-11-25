"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useLang } from "@/components/lang-provider";
import { saved, type Saved, subscribeCart } from "@/lib/cart";

const snapshot = () => JSON.stringify(saved.list());

export function SavedView() {
  const { t } = useLang();
  const list = JSON.parse(useSyncExternalStore(subscribeCart, snapshot, () => "[]")) as Saved[];
  if (!list.length) return <div className="card p-8 text-center"><h2 className="text-2xl">{t("Asnjë material i ruajtur.", "No saved materials.")}</h2><p className="mt-2 text-ink-2">{t("Shtyp zemrën te një listim për ta ruajtur këtu.", "Tap the heart on a listing to save it here.")}</p><Link href="/treg" className="btn-primary mt-5">{t("Hap tregun", "Open the marketplace")}</Link></div>;
  return (
    <ul className="grid gap-3">{list.map((s) => (
      <li key={s.id} className="card flex items-center justify-between gap-3 p-4"><Link href={s.href} className="font-medium hover:underline">{s.title}</Link><button type="button" onClick={() => saved.toggle(s)} className="text-sm text-ink-2 underline">{t("Hiq", "Remove")}</button></li>
    ))}</ul>
  );
}
