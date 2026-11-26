import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Kushtet e përdorimit", "Terms & Conditions") };
}

export default async function KushtetPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const email = process.env.PILOT_CONTACT_EMAIL;
  return (
    <LegalPage
      title={t("Kushtet e përdorimit", "Terms & Conditions")}
      lead={t("Si funksionon ECONERA gjatë pilotit në Tiranë: çfarë ofrojmë, çfarë kontrollojmë dhe çfarë mbetet përgjegjësi e palëve.", "How ECONERA works during the Tirana pilot: what we offer, what we check and what remains the responsibility of each party.")}
      updated={t("Përditësuar më 26 nëntor 2026", "Updated 26 November 2026")}
      sections={[
        [t("Shërbimi", "The service"), <p key="a">{t("ECONERA është treg dixhital që lidh blerësit me shitësit e materialeve të ndërtimit, të reja, të rikuperuara ose të tepërta, me mjete AI për planifikim. ECONERA nuk është shitësi i materialeve; kontrata e shitjes lidhet mes blerësit dhe shitësit.", "ECONERA is a digital marketplace connecting buyers with sellers of new, reclaimed and surplus construction materials, with AI tools for planning. ECONERA is not the seller of the materials; the sale contract is between the buyer and the seller.")}</p>],
        [t("Llogaritë", "Accounts"), <p key="b">{t("Për të blerë ose shitur duhet një llogari me të dhëna të sakta. Shitësit duhet të kalojnë verifikimin e identitetit ose të biznesit para se të publikojnë listime.", "Buying or selling requires an account with accurate details. Sellers must complete identity or business verification before publishing listings.")}</p>],
        [t("Listimet dhe shqyrtimi", "Listings and review"), <p key="c">{t("Çdo listim shqyrtohet nga një person i ECONERA para publikimit. Shqyrtimi kontrollon dokumentet dhe informacionin e dorëzuar; nuk është inspektim fizik ose certifikim i pavarur, përveç kur kjo shënohet veçmas. Shitësi mbetet përgjegjës për saktësinë e përshkrimit, sasisë dhe gjendjes.", "Every listing is reviewed by a person at ECONERA before publication. The review checks submitted documents and information; it is not a physical inspection or independent certification unless stated separately. The seller remains responsible for the accuracy of the description, quantity and condition.")}</p>],
        [t("Çmimet, abonimet dhe komisioni", "Prices, subscriptions and commission"), <p key="d">{t("Blerësit nuk paguajnë abonim. Furnitorët zgjedhin një plan dhe paguajnë komisionin e planit vetëm për porositë e kryera dhe të konfirmuara nga të dyja palët. Çmimet e planeve janë në lekë, pa TVSH. Plani mund të ndryshohet në çdo kohë dhe vlen nga muaji pasardhës. Detajet janë te ", "Buyers pay no subscription. Suppliers choose a plan and pay that plan's commission only on orders completed and confirmed by both parties. Plan prices are in lek, excluding VAT. A plan can be changed at any time and applies from the following month. Details are on ")}<Link href="/cmimet">{t("Planet dhe çmimet", "Plans & Pricing")}</Link>.</p>],
        [t("Mjetet AI", "AI tools"), <p key="e">{t("Rezultatet e AI Renovation, Smart Basket, SmartCut dhe ECONERA Voice janë vlerësime ndihmëse. Kontrolloni sasitë, përmasat dhe përshtatshmërinë teknike me një profesionist para blerjes ose ndërtimit.", "Results from AI Renovation, Smart Basket, SmartCut and ECONERA Voice are supporting estimates. Check quantities, dimensions and technical suitability with a professional before buying or building.")}</p>],
        [t("Ankesat", "Complaints"), <p key="f">{t("Problemet me një porosi ose listim raportohen te ", "Problems with an order or listing are reported through ")}<Link href="/mbrojtja">{t("Mbrojtja e klientit", "Customer Protection")}</Link>{t("; çdo ankesë e shqyrton një person.", "; every complaint is reviewed by a person.")}</p>],
        [t("Kontakt", "Contact"), <p key="g">{t("Pyetje për këto kushte: ", "Questions about these terms: ")}{email ? <a href={`mailto:${email}`}>{email}</a> : <Link href="/kontakt">{t("formulari i kontaktit", "the contact form")}</Link>}.</p>],
      ]}
      related={[["/privatesia", t("Privatësia", "Privacy Policy")], ["/cookies", t("Politika e cookies", "Cookie Policy")], ["/mbrojtja", t("Mbrojtja e klientit", "Customer Protection")]]}
    />
  );
}
