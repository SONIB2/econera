import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Aksesueshmëria", "Accessibility") };
}

export default async function QasshmeriaPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <LegalPage
      title={t("Aksesueshmëria", "Accessibility")}
      lead={t("Synojmë që ECONERA të përdoret lehtësisht me tastierë, lexues ekrani dhe pajisje të lëvizshme.", "We aim for ECONERA to be easy to use with a keyboard, a screen reader and mobile devices.")}
      updated={t("Përditësuar më 26 nëntor 2026", "Updated 26 November 2026")}
      sections={[
        [t("Tastiera", "Keyboard"), <p key="a">{t("Shtyp Tab për të lëvizur midis lidhjeve dhe fushave; Escape mbyll menutë dhe dritaret. Lidhja “Kalo te përmbajtja” shfaqet sapo merr fokus.", "Press Tab to move between links and fields; Escape closes menus and dialogs. A “Skip to content” link appears as soon as it receives focus.")}</p>],
        [t("Preferencat", "Preferences"), <p key="b">{t("Faqja ndjek zmadhimin e tekstit dhe reduktimin e animacioneve të sistemit; tema e çelët ose e errët zgjidhet nga butoni në krye. Te Asistenti mund të rrisni madhësinë e tekstit dhe kontrastin, dhe të dëgjoni përgjigjet me zë.", "The site follows your system text size and reduced-motion settings; light or dark theme is chosen from the header toggle. In the Assistant you can increase text size and contrast and hear answers read aloud.")}</p>],
        [t("Kufizime të njohura", "Known limitations"), <p key="c">{t("Pamja 3D në faqen kryesore është dekorative; e njëjta përmbajtje është në dispozicion si tekst poshtë saj.", "The 3D view on the homepage is decorative; the same content is available as text below it.")}</p>],
        [t("Raporto një problem", "Report a problem"), <p key="d">{t("Nëse diçka nuk funksionon me teknologjinë tuaj ndihmëse, na shkruani te ", "If something does not work with your assistive technology, write to us through ")}<Link href="/kontakt">{t("Kontakt", "Contact")}</Link>.</p>],
      ]}
      related={[["/privatesia", t("Privatësia", "Privacy Policy")], ["/kushtet", t("Kushtet e përdorimit", "Terms & Conditions")]]}
    />
  );
}
