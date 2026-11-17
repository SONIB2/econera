import Link from "next/link";
import { Field, Notice, PageIntro } from "@/components/ui";
import { regions } from "@/lib/data";
import { organizationRole, readMemberships } from "@/lib/organizations";
import { requireAccount } from "@/lib/supabase";
import { acceptInvitation, createOrganization } from "./actions";

export const metadata = { title: "Organizatat" };

export default async function Organizations({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { db, user } = await requireAccount();
  const { data, error } = await readMemberships(db, user.id);
  return <>
    <PageIntro eyebrow="LLOGARIA E BIZNESIT" title="Organizatat">Krijo një organizatë ose bashkohu me një ekip me kod ftese.</PageIntro>
    <Notice status={(await searchParams).status} />
    <section className="panel workspace-stack">
      <h2>Anëtarësimet</h2>
      {error ? <p role="status">Anëtarësimet nuk u ngarkuan.</p> : data.length === 0 ? <p>Ende nuk je pjesë e një organizate.</p> :
        <ul className="workspace-org-list">{data.map(({ organization, role }) => <li key={organization.id}><Link href={`/paneli/organizatat/${organization.id}`}>{organization.name}</Link><span>{organizationRole[role]}</span></li>)}</ul>}
    </section>
    <div className="workspace-forms">
      <form action={createOrganization} className="panel workspace-form">
        <h2 className="row-title">Krijo organizatë</h2>
        <Field label="Emri i organizatës"><input name="name" autoComplete="organization" required minLength={2} maxLength={100} /></Field>
        <Field label="Qarku (opsional)"><select name="region" defaultValue=""><option value="">Pa përzgjedhje</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></Field>
        <button className="button">Krijo organizatën</button>
      </form>
      <form action={acceptInvitation} className="panel workspace-form">
        <h2 className="row-title">Bashkohu me një organizatë</h2>
        <Field label="Kodi i ftesës"><input name="code" required maxLength={40} autoComplete="off" spellCheck={false} /></Field>
        <p className="workspace-note">Përdor llogarinë me adresën e emailit për të cilën u krijua ftesa.</p>
        <button className="button secondary">Prano ftesën</button>
      </form>
    </div>
  </>;
}
