import type { Metadata } from "next";
import { adminLogout } from "@/app/(site)/actions";
import { AdminLogin } from "@/components/site/admin-login";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { formatDate } from "@/lib/format";
import { INTERESTS, listLeads, ROLES, storageMode } from "@/lib/leads";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured()) {
    return <Shell><div className="card p-8"><h1 className="display text-3xl">Admin nuk është konfiguruar.</h1><p className="mt-3 text-ink-2">Shto <code className="text-lime">ADMIN_PASSWORD</code> (të paktën 10 karaktere) te <code>.env.local</code> dhe rinis serverin.</p></div></Shell>;
  }
  if (!(await isAdmin())) return <Shell><AdminLogin /></Shell>;

  const leads = await listLeads();
  const count = (k: string, v: string) => leads.filter((l) => (l as Record<string, unknown>)[k] === v).length;
  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin · regjistrimet</p>
          <h1 className="display mt-3 text-5xl">{leads.length} regjistrime</h1>
          <p className="mt-2 text-sm text-ink-2">Ruajtja: {storageMode() === "supabase" ? "Supabase" : "skedar lokal (.data/leads.json)"}</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/pilot/eksport" className="btn-primary">Eksporto CSV</a>
          <form action={adminLogout}><button className="btn-ghost">Dil</button></form>
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[["Furnitorë", count("role", "furnitor")], ["Kontraktorë", count("role", "kontraktor")], ["Me stok për të shitur", count("interest", "ka") + count("interest", "te_dyja")]].map(([l, n]) => (
          <div key={String(l)} className="card p-5"><p className="display text-3xl text-lime">{n}</p><p className="text-sm text-ink-2">{l}</p></div>
        ))}
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs text-ink-2"><tr className="border-b border-line">{["Data", "Kompania", "Kontakti", "Roli", "Qyteti", "Interesi", "Materialet"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-line/60 align-top">
                <td className="px-4 py-3 whitespace-nowrap text-ink-2">{formatDate(new Date(l.created_at))}</td>
                <td className="px-4 py-3">{l.company}{l.nipt && <span className="block text-xs text-ink-2">{l.nipt}</span>}</td>
                <td className="px-4 py-3">{l.contact}<span className="block text-xs text-ink-2">{l.email}{l.phone && ` · ${l.phone}`}</span></td>
                <td className="px-4 py-3">{ROLES[l.role]}</td>
                <td className="px-4 py-3">{l.city}</td>
                <td className="px-4 py-3">{INTERESTS[l.interest]}</td>
                <td className="max-w-xs px-4 py-3 text-ink-2">{l.materials}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-2">Ende asnjë regjistrim.</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="container-x py-14">{children}</section>;
}
