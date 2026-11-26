import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/ui";
import { organizationRole, readMemberships } from "@/lib/organizations";
import { requireAccount } from "@/lib/supabase";

export default async function Workspace() {
  const { db, user } = await requireAccount();
  const [profile, inventory, quotes, organizations] = await Promise.all([
    db.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    db.from("materials").select("id", { count: "exact", head: true }).eq("owner_id", user.id).neq("publication", "archived"),
    db.from("quotation_requests").select("id", { count: "exact", head: true }).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
    readMemberships(db, user.id),
  ]);
  const metrics = [
    { label: "Materiale të paarkivuara", value: inventory.error ? null : inventory.count },
    { label: "Kërkesa për ofertë", value: quotes.error ? null : quotes.count },
    { label: "Organizata", value: organizations.error ? null : organizations.data.length },
  ];

  return <>
    <PageIntro eyebrow="PËRMBLEDHJE" title={profile.data?.display_name ? `Mirë se erdhe, ${profile.data.display_name}` : "Paneli ECONERA"}>Shiko aktivitetin e llogarisë dhe menaxho ku bën pjesë.</PageIntro>
    <dl className="workspace-metrics">{metrics.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd className={value === null ? "metric-unavailable" : undefined}>{value ?? "Nuk u ngarkua"}</dd></div>)}</dl>
    <section className="panel workspace-stack">
      <div className="workspace-heading"><h2>Organizatat e tua</h2><Link className="text-link" href="/paneli/organizatat">Menaxho organizatat <ArrowRight size={17} aria-hidden /></Link></div>
      {organizations.error ? <p role="status">Organizatat nuk u ngarkuan. Provo përsëri pas pak.</p> :
      organizations.data.length === 0 ? <p>Krijo organizatën tënde ose përdor kodin e ftesës nga pronari.</p> :
      <ul className="workspace-org-list">{organizations.data.slice(0, 5).map(({ organization, role }) => <li key={organization.id}><Link href={`/paneli/organizatat/${organization.id}`}>{organization.name}</Link><span>{organizationRole[role]}</span></li>)}</ul>}
    </section>
    {!profile.error && !profile.data && <section className="panel workspace-stack"><h2>Plotëso profilin</h2><p>Shto emrin e profilit për ta njohur më lehtë llogarinë tënde.</p><Link className="text-link" href="/inventari/profili">Hap profilin <ArrowRight size={17} aria-hidden /></Link></section>}
    <section className="panel workspace-stack"><h2>Të dhënat e tua</h2><p>Shkarko një kopje të të dhënave të llogarisë tënde (JSON). Për fshirjen e llogarisë, na shkruaj nga <Link className="text-link" href="/kontakt">faqja e kontaktit</Link>.</p><a className="text-link" href="/api/account/export">Shkarko të dhënat e mia</a></section>
    <section className="panel workspace-stack"><h2>Modulet e ardhshme</h2><p>Projektet, porositë, analizat dhe ECONERA AI do të hapen pasi të përfundojnë rrjedhat e tyre të punës.</p></section>
  </>;
}
