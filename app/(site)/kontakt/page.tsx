import type { Metadata } from "next";
import { LeadForm } from "@/components/site/lead-form";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Lista e pritjes", description: "Regjistrohu si furnitor ose kontraktor për pilotin e ECONERA në Tiranë." };

export default function KontaktPage() {
  const email = process.env.PILOT_CONTACT_EMAIL;
  return (
    <>
      <PageHero eyebrow="Lista e pritjes" title="Bëhu pjesë e pilotit." lead="12 muaj në Tiranë, me 20 furnitorë dhe 10 kontraktorë. Na trego çfarë materialesh ke ose kërkon." />
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_340px]">
        <LeadForm source="kontakt" />
        <aside className="space-y-4">
          {[["20", "furnitorë pilot"], ["10", "kontraktorë"], ["20 t", "materiale të ripërdorura"]].map(([n, l]) => (
            <div key={l} className="card p-6"><p className="display text-4xl text-lime">{n}</p><p className="mt-1 text-sm text-ink-2">{l} në 12 muajt e parë</p></div>
          ))}
          <div className="card p-6 text-sm text-ink-2">
            <p className="text-ink">Pse të regjistrohesh tani?</p>
            <p className="mt-2">Pjesëmarrësit e pilotit regjistrojnë stokun falas dhe ndihmojnë të formësojmë platformën.</p>
            {email && <p className="mt-3">Ose shkruaj direkt: <a className="text-lime underline underline-offset-4" href={`mailto:${email}`}>{email}</a></p>}
          </div>
        </aside>
      </section>
    </>
  );
}
