import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, Notice, PageIntro } from "@/components/ui";
import { uuid } from "@/lib/data";
import { organizationRole, readMembership } from "@/lib/organizations";
import { requireAccount } from "@/lib/supabase";
import { InviteForm } from "./invite-form";

export const metadata = { title: "Organizata" };

export default async function OrganizationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const { db, user } = await requireAccount();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { data, error } = await readMembership(db, user.id, id);
  if (error) return <Empty title="Organizata nuk u ngarkua" href="/paneli/organizatat" label="Kthehu te organizatat">Provo përsëri pas pak.</Empty>;
  if (!data) notFound();

  return <>
    <Link href="/paneli/organizatat" className="text-link">Kthehu te organizatat</Link>
    <PageIntro eyebrow="ORGANIZATA" title={data.organization.name}>{data.organization.region && `${data.organization.region} · `}{organizationRole[data.role]}</PageIntro>
    <Notice status={(await searchParams).status} />
    {data.role === "owner" ? <InviteForm organization={id} /> : <p className="panel">Vetëm pronari i organizatës mund të krijojë ftesa.</p>}
  </>;
}
