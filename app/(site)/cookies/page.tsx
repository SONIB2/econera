import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Politika e cookies", "Cookie Policy") };
}

export default async function CookiesPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <LegalPage
      title={t("Politika e cookies", "Cookie Policy")}
      lead={t("ECONERA përdor vetëm cookies dhe ruajtje lokale që i duhen faqes për të punuar. Nuk përdorim cookies për reklama ose ndjekje.", "ECONERA uses only the cookies and local storage the site needs to work. We use no advertising or tracking cookies.")}
      updated={t("Përditësuar më 26 nëntor 2026", "Updated 26 November 2026")}
      sections={[
        [t("Cookies teknike", "Essential cookies"), <ul key="a">
          <li><strong>lang</strong>: {t("gjuha që zgjodhët (shqip ose anglisht).", "the language you chose (Albanian or English).")}</li>
          <li><strong>region</strong>: {t("shteti dhe monedha për çmimet.", "the country and currency for prices.")}</li>
          <li><strong>sb-…</strong>: {t("seanca e hyrjes në llogari, vetëm kur hyni.", "your sign-in session, only when you log in.")}</li>
          <li><strong>econera_admin</strong>: {t("seanca e administrimit, vetëm për stafin.", "the administration session, staff only.")}</li>
        </ul>],
        [t("Ruajtja lokale në shfletues", "Local storage in your browser"), <p key="b">{t("Shporta, projektet e ruajtura, tema e çelët ose e errët, preferencat e aksesueshmërisë dhe nëse paneli i mjeteve AI është i hapur ruhen vetëm në shfletuesin tuaj. Mund t'i fshini në çdo kohë nga cilësimet e shfletuesit.", "Your cart, saved projects, light or dark theme, accessibility preferences and whether the AI tools dock is open are stored only in your browser. You can clear them at any time in your browser settings.")}</p>],
        [t("Statistikat", "Statistics"), <p key="c">{t("Aktualisht nuk përdorim shërbime analitike ose cookies ndjekëse. Nëse kjo ndryshon, kjo faqe përditësohet më parë.", "We currently use no analytics services or tracking cookies. If that changes, this page will be updated first.")}</p>],
        [t("Më shumë", "More"), <p key="d">{t("Si i përdorim të dhënat personale shpjegohet te ", "How we use personal data is explained in the ")}<Link href="/privatesia">{t("Politika e privatësisë", "Privacy Policy")}</Link>.</p>],
      ]}
      related={[["/privatesia", t("Privatësia", "Privacy Policy")], ["/kushtet", t("Kushtet e përdorimit", "Terms & Conditions")]]}
    />
  );
}
