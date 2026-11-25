"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/lang-provider";
import { formatDate } from "@/lib/format";
import { projects, type Project } from "@/lib/tools/projects";

const KIND = {
  renovim: { sq: "AI Renovation", en: "AI Renovation", href: "/ai/renovim" },
  shporta: { sq: "Smart Basket", en: "Smart Basket", href: "/ai/shporta" },
  smartcut: { sq: "SmartCut", en: "SmartCut", href: "/ai/smartcut" },
} as const;

export function MyProjects() {
  const { lang, t } = useLang();
  const [list, setList] = useState<Project[] | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setList(projects.list());
    const timer = setTimeout(load, 0);
    window.addEventListener("econera-projects", load);
    return () => { clearTimeout(timer); window.removeEventListener("econera-projects", load); };
  }, []);

  if (list === null) return <p className="text-ink-2">{t("Duke ngarkuar…", "Loading…")}</p>;
  if (!list.length) return (
    <div className="card p-8 text-center">
      <h2 className="text-2xl">{t("Ende s'ke projekte.", "No projects yet.")}</h2>
      <p className="mt-2 text-ink-2">{t("Nis një rinovim, një shportë ose një plan prerjeje dhe ruaje këtu.", "Start a renovation, a basket or a cutting plan and save it here.")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{Object.values(KIND).map((k) => <Link key={k.href} href={k.href} className="btn-ghost">{k[lang]}</Link>)}</div>
    </div>
  );

  return (
    <div className="grid gap-4">
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <li key={p.id} className="card flex flex-col p-5">
            <span className="text-xs font-medium text-lime-dim">{KIND[p.kind][lang]}</span>
            <h2 className="mt-1 text-xl">{p.title}</h2>
            <p className="mt-1 text-sm text-ink-2">{t("Ndryshuar", "Updated")} {lang === "en" ? new Date(p.updatedAt).toLocaleDateString("en-GB") : formatDate(new Date(p.updatedAt))}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`${KIND[p.kind].href}?projekt=${p.id}`} className="btn-primary">{t("Hap", "Open")}</Link>
              {confirm === p.id ? (
                <>
                  <button type="button" className="btn-ghost border-[#b5543a] text-[#8a2f1d]" onClick={() => { projects.remove(p.id); setConfirm(null); }}>{t("Po, fshije përgjithmonë", "Yes, delete permanently")}</button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirm(null)}>{t("Anulo", "Cancel")}</button>
                </>
              ) : <button type="button" className="btn-ghost" onClick={() => setConfirm(p.id)}>{t("Fshi", "Delete")}</button>}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-2">{t("Projektet dhe fotot ruhen vetëm në këtë shfletues. Sinkronizimi me llogarinë vjen kur të aplikohet migrimi tool_projects në Supabase.", "Projects and photos are stored in this browser only. Account sync arrives once the tool_projects migration is applied in Supabase.")}</p>
    </div>
  );
}
