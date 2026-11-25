import type { Metadata } from "next";
import Link from "next/link";
import { markNotificationsRead } from "@/app/(site)/verify-actions";
import { ToolHeader } from "@/components/tools/tool-header";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { requireAccount } from "@/lib/supabase";
import { NOTIFICATION } from "@/lib/verify/labels";

export const metadata: Metadata = { title: "Njoftimet", robots: { index: false } };

function link(kind: string, subject: string | null) {
  if (!subject) return null;
  if (kind.startsWith("listing.") || kind === "document.expiring") return `/verifikimi/listimi/${subject}`;
  if (kind.startsWith("seller.")) return "/verifikimi";
  if (kind.startsWith("dispute.")) return "/mbrojtja";
  if (kind.startsWith("staff.listing") || kind.startsWith("staff.second") || kind.startsWith("staff.escalated")) return `/admin/listimet/${subject}`;
  if (kind === "staff.seller_case") return `/admin/shitesit/${subject}`;
  if (kind === "staff.dispute") return `/admin/ankesat/${subject}`;
  if (kind === "buyer.safety_notice") return `/verifikim/${subject}`;
  return null;
}

export default async function Notifications() {
  const { db } = await requireAccount();
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { data, error } = await db.from("notifications").select("id,kind,subject_id,payload,read_at,created_at").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <ToolHeader hub="ECONERA Verify" hubHref="/verifikimi" name={t("Njoftimet", "Notifications")} title={t("Njoftimet.", "Notifications.")} lead={t("Statusi i verifikimit, shqyrtimet dhe njoftimet e sigurisë.", "Verification status, reviews and safety notices.")} />
      <div className="container-x grid gap-4 pb-20">
        {error && <p className="text-sm text-ink-2">{t("Njoftimet nuk janë aktive ende.", "Notifications are not active yet.")}</p>}
        {!!data?.some((n) => !n.read_at) && <form action={markNotificationsRead}><button className="btn-ghost">{t("Shëno të gjitha si të lexuara", "Mark all as read")}</button></form>}
        {!data?.length && !error && <p className="text-ink-2">{t("Asnjë njoftim.", "No notifications.")}</p>}
        <ul className="grid gap-2">
          {data?.map((n) => {
            const href = link(n.kind, n.subject_id);
            const p = n.payload as { title?: string; reason?: string };
            const body = <><span className="font-medium">{NOTIFICATION[n.kind]?.[lang] ?? n.kind}</span>{p.title && <span className="block text-ink-2">{p.title}</span>}{p.reason && <span className="block text-ink-2">{t("Arsyeja", "Reason")}: {p.reason}</span>}<span className="mt-1 block text-xs text-ink-2">{new Date(n.created_at).toLocaleString("en-GB")}</span></>;
            return <li key={n.id} className={`card p-4 text-sm ${n.read_at ? "opacity-70" : "border-lime/50"}`}>{href ? <Link href={href} className="block">{body}</Link> : body}</li>;
          })}
        </ul>
        <p className="text-xs text-ink-2">{t("Njoftimet me email kërkojnë një shërbim dërgimi (p.sh. Resend); shih docs/VERIFY.md.", "Email notifications need a delivery service (e.g. Resend); see docs/VERIFY.md.")}</p>
      </div>
    </>
  );
}
