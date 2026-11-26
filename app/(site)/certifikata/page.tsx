import type { Metadata } from "next";
import { CertificateBuilder } from "@/components/certificate/certificate-builder";
import { PageHero } from "@/components/site/page-hero";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Certifikata e gjelbër", "Green certificate"), description: tr(lang, "Vlerësim i CO₂ dhe i mbetjeve të shmangura për materialet e ripërdorura, me shkarkim PDF.", "An estimate of CO₂ and waste avoided by reusing materials, with PDF download.") };
}

export default async function CertifikataPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <>
      <PageHero eyebrow={t("Certifikata e gjelbër", "Green certificate")} title={t("CO₂ e kursyer për çdo porosi.", "CO₂ saved on every order.")}
        lead={t("Zgjidh materialin dhe sasinë. Merr një vlerësim të CO₂ dhe të mbetjeve të shmangura. Është vlerësim me faktorë publikë, jo matje e certifikuar.", "Choose the material and quantity to get an estimate of CO₂ and waste avoided. It uses published factors and is not a certified measurement.")} />
      <CertificateBuilder />
    </>
  );
}
