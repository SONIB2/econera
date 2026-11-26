import type { Metadata } from "next";
import Link from "next/link";
import { TrustCompliance } from "@/components/home/trust-compliance";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: "ECONERA Verify", description: tr(lang, "Si i verifikon ECONERA shitësit, listimet dhe dokumentet e materialeve.", "How ECONERA verifies sellers, listings and material documents.") };
}

/** Public overview of ECONERA Verify; the seller form itself lives at /verifikimi behind sign-in. */
export default async function VerifyPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <>
      <section className="container-x py-12 text-center md:py-14">
        <h1 className="display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1.04] text-[#0c2f2b] dark:text-ink">ECONERA Verify</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-2">{t("Çfarë kontrollojmë, kush e kontrollon dhe çfarë nuk premtojmë: verifikimi i shitësve, shqyrtimi i listimeve dhe pasaporta e materialit.", "What we check, who checks it and what we do not promise: seller verification, listing review and the material passport.")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/verifikimi" className="btn-primary">{t("Verifiko llogarinë e shitësit", "Verify your seller account")}</Link>
          <Link href="/mbrojtja" className="btn-ghost">{t("Raporto një problem", "Report a problem")}</Link>
        </div>
      </section>
      <TrustCompliance lang={lang} business={false} />
    </>
  );
}
