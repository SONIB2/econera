import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Building2, ClipboardList, LayoutGrid, Settings, Store } from "lucide-react";
import { signOut } from "@/app/(legacy)/account-actions";
import { Brand } from "@/components/brand";
import { requireAccount } from "@/lib/supabase";
import "./workspace.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Paneli", template: "%s | Paneli ECONERA" }, robots: { index: false, follow: false } };

const navigation = [
  { label: "Përmbledhje", path: "/paneli", icon: LayoutGrid },
  { label: "Organizatat", path: "/paneli/organizatat", icon: Building2 },
  { label: "Inventari", path: "/inventari", icon: Boxes },
  { label: "Tregu", path: "/materiale", icon: Store },
  { label: "Kërkesat për ofertë", path: "/inventari/ofertat", icon: ClipboardList },
  { label: "Profili yt", path: "/inventari/profili", icon: Settings },
];

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireAccount();
  return <div className="container workspace-layout">
    <aside className="workspace-sidebar">
      <Brand />
      <p className="eyebrow">HAPËSIRA E PUNËS</p>
      <nav aria-label="Navigimi i panelit">
        {navigation.map(({ label, path, icon: Icon }) => <Link key={path} href={path}><Icon size={18} aria-hidden />{label}</Link>)}
      </nav>
      <form action={signOut}><button className="button secondary">Dil nga llogaria</button></form>
    </aside>
    <div className="workspace-body">{children}</div>
  </div>;
}
