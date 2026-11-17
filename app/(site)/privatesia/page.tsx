import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Privatësia", description: "Si i mbledh, i përdor dhe i mbron ECONERA të dhënat personale." };

export default function PrivatesiaPage() {
  const email = process.env.PILOT_CONTACT_EMAIL;
  const sections: [string, React.ReactNode][] = [
    ["Kush jemi", <>ECONERA është projekt startup i themeluar nga Sonila Balla dhe Rey Sylaj në Tiranë. Ne jemi përgjegjës për të dhënat që mblidhen në këtë faqe.</>],
    ["Çfarë mbledhim", <>Vetëm atë që shkruani në formularët e listës së pritjes: emrin e kompanisë, NIPT-in (opsional), personin e kontaktit, email-in, telefonin (opsional), rolin, qytetin dhe përshkrimin e materialeve. Ruajmë edhe datën e pëlqimit.</>],
    ["Pse i mbledhim", <>Për t&apos;ju kontaktuar rreth pilotit të ECONERA dhe për të ditur sa interes ka tregu. Baza ligjore është pëlqimi juaj. Nuk i përdorim për reklama dhe nuk ia shesim askujt.</>],
    ["Ku ruhen dhe sa kohë", <>Në një databazë të mbrojtur, të aksesueshme vetëm nga themeluesit. I ruajmë deri në 24 muaj pas regjistrimit, ose më pak nëse kërkoni fshirjen.</>],
    ["Cookies dhe statistikat", <>Faqja nuk përdor cookies për reklama ose ndjekje. Numrin e vizitave e masim me statistika anonime, pa identifikuar vizitorët. Faqja e administrimit përdor vetëm një cookie teknike për hyrjen.</>],
    ["AI", <>Kur përdorni demot e AI-t, teksti ose imazhi që ngarkoni dërgohet te ofruesi i modelit vetëm për të gjeneruar përgjigjen dhe nuk ruhet nga ne. Mos ngarkoni të dhëna personale në demo.</>],
    ["Të drejtat tuaja", <>Mund të kërkoni qasje, korrigjim ose fshirje të të dhënave, ose të tërhiqni pëlqimin në çdo kohë{email ? <> duke shkruar te <a className="text-lime underline underline-offset-4" href={`mailto:${email}`}>{email}</a></> : null}. Keni të drejtë të ankoheni te Komisioneri për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave Personale.</>],
  ];
  return (
    <>
      <PageHero eyebrow="Privatësia" title="Të dhënat tuaja, të mbrojtura." lead="Mbledhim vetëm atë që duhet për pilotin. Përditësuar më 17 nëntor 2026." />
      <section className="container-x max-w-3xl py-14">
        <div className="grid gap-10">
          {sections.map(([title, body]) => (
            <article key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-relaxed text-ink-2">{body}</p></article>
          ))}
        </div>
      </section>
    </>
  );
}
