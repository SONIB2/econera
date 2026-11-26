import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Privatësia", "Privacy Policy"), description: tr(lang, "Si i mbledh, i përdor dhe i mbron ECONERA të dhënat personale.", "How ECONERA collects, uses and protects personal data.") };
}

/** Describes what the platform actually stores today. Wording to be confirmed by legal counsel before launch beyond the pilot. */
export default async function PrivatesiaPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const email = process.env.PILOT_CONTACT_EMAIL;
  const contact = email ? <a href={`mailto:${email}`}>{email}</a> : <Link href="/kontakt">{t("formulari i kontaktit", "the contact form")}</Link>;
  return (
    <LegalPage
      title={t("Politika e privatësisë", "Privacy Policy")}
      lead={t("Mbledhim vetëm atë që duhet që tregu dhe verifikimi të funksionojnë.", "We collect only what the marketplace and verification need to work.")}
      updated={t("Përditësuar më 26 nëntor 2026", "Updated 26 November 2026")}
      sections={[
        [t("Kush jemi", "Who we are"), <p key="a">{t("ECONERA është një platformë për ndërtimin qarkullues me bazë në Tiranë, Shqipëri, dhe është përgjegjëse për të dhënat e mbledhura në këtë faqe.", "ECONERA is a circular-construction platform based in Tirana, Albania, and is responsible for the data collected on this site.")}</p>],
        [t("Çfarë mbledhim", "What we collect"), <ul key="b">
          <li>{t("Llogaria: email-i dhe fjalëkalimi (i ruajtur i koduar nga ofruesi i autentikimit).", "Account: your email and password (stored hashed by the authentication provider).")}</li>
          <li>{t("Verifikimi i shitësit: emri ligjor, shteti, telefoni, adresa, NIPT-i dhe dokumentet që ngarkoni.", "Seller verification: legal name, country, phone, address, registration number and the documents you upload.")}</li>
          <li>{t("Listimet, kërkesat për ofertë, ankesat dhe mesazhet që dërgoni.", "Listings, quote requests, complaints and messages you send.")}</li>
          <li>{t("Formularët e kontaktit dhe të partneritetit, me datën e pëlqimit.", "Contact and partnership forms, with the date of your consent.")}</li>
        </ul>],
        [t("Pse i përdorim", "Why we use it"), <p key="c">{t("Për të ofruar llogarinë, për të shqyrtuar shitësit dhe listimet, për të lidhur blerësit me shitësit dhe për t'ju kontaktuar kur e kërkoni. Nuk i përdorim për reklama dhe nuk ia shesim askujt.", "To run your account, review sellers and listings, connect buyers with sellers and contact you when you ask us to. We do not use it for advertising and do not sell it.")}</p>],
        [t("Kush ka qasje", "Who has access"), <p key="d">{t("Dokumentet e verifikimit ruhen në hapësirë private. I shohin vetëm ju dhe stafi i autorizuar i ECONERA, dhe çdo hapje regjistrohet. Blerësit shohin vetëm emrin publik të shitësit dhe statusin e verifikimit.", "Verification documents are kept in private storage. Only you and authorised ECONERA staff can open them, and every opening is logged. Buyers see only the seller's public name and verification status.")}</p>],
        [t("Sa kohë i ruajmë", "How long we keep it"), <p key="e">{t("Formularët e kontaktit deri në 24 muaj. Të dhënat e llogarisë dhe verifikimit ruhen sa kohë llogaria është aktive, ose më shumë kur e kërkon ligji. Mund të kërkoni fshirjen në çdo kohë.", "Contact forms for up to 24 months. Account and verification data for as long as the account is active, or longer where the law requires it. You can ask for deletion at any time.")}</p>],
        [t("Cookies", "Cookies"), <p key="f">{t("Vetëm cookies teknike. Detajet te ", "Essential cookies only. Details in the ")}<Link href="/cookies">{t("Politika e cookies", "Cookie Policy")}</Link>.</p>],
        [t("AI", "AI"), <p key="g">{t("Kur përdorni mjetet AI, teksti ose fotoja dërgohet te ofruesi i modelit vetëm për të gjeneruar përgjigjen dhe nuk ruhet nga ne. Mos ngarkoni të dhëna personale.", "When you use the AI tools, your text or photo is sent to the model provider only to generate the answer and is not stored by us. Do not upload personal data.")}</p>],
        [t("Të drejtat tuaja", "Your rights"), <p key="h">{t("Mund të kërkoni qasje, korrigjim ose fshirje të të dhënave, ose të tërhiqni pëlqimin, përmes: ", "You can ask to access, correct or delete your data, or withdraw consent, through: ")}{contact}. {t("Kur jeni të identifikuar, mund të shkarkoni vetë një kopje të të dhënave tuaja: ", "When signed in, you can download a copy of your data yourself: ")}<a href="/api/account/export">{t("shkarko të dhënat", "download my data")}</a>. {t("Keni të drejtë të ankoheni te Komisioneri për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave Personale.", "You may complain to Albania's Information and Data Protection Commissioner.")}</p>],
      ]}
      related={[["/kushtet", t("Kushtet e përdorimit", "Terms & Conditions")], ["/cookies", t("Politika e cookies", "Cookie Policy")]]}
    />
  );
}
