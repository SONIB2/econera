import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin ECONERA" }, robots: { index: false, follow: false } };

/** ECONERA Verify administration. Each page checks the staff role server-side; PostgreSQL checks it again. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const nav = [
    ["/admin", t("Përmbledhja", "Overview")], ["/admin/listimet", t("Listimet", "Listings")], ["/admin/shitesit", t("Shitësit", "Sellers")],
    ["/admin/ankesat", t("Ankesat", "Complaints")], ["/admin/rregullat", t("Rregullat", "Requirements")], ["/admin/stafi", t("Stafi", "Staff")],
    ["/admin/partneret", t("Partnerët", "Partners")], ["/admin/auditi", t("Auditi", "Audit log")], ["/admin/pilot", t("Lista e pilotit", "Pilot list")],
  ];
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-sm font-semibold">ECONERA Verify</p>
        <p className="text-xs text-ink-2">{t("Vetëm për stafin e autorizuar", "Authorised staff only")}</p>
        <nav aria-label="Admin" className="mt-4 flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-bg-2 hover:text-ink">{label}</Link>)}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
