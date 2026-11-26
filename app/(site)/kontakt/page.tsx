import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/site/lead-form";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: tr(lang, "Kontakt", "Contact"),
    description: tr(lang, "Na shkruani për tregun, shitjen e materialeve ose pilotin e ECONERA në Tiranë.", "Write to ECONERA about the marketplace, selling materials or the Tirana pilot."),
  };
}

export default async function KontaktPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const email = process.env.PILOT_CONTACT_EMAIL;
  const goals: [string, string, string][] = [["20", "furnitorë", "suppliers"], ["10", "kontraktorë", "contractors"], ["20 t", "materiale të ripërdorura", "of reused materials"]];
  return (
    <>
      <section className="container-x pt-12 pb-2 md:pt-14">
        <h1 className="display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1.04] text-[#0c2f2b] dark:text-ink">{t("Na kontaktoni", "Contact ECONERA")}</h1>
        <p className="mt-3 max-w-2xl text-ink-2">{t("Na tregoni kush jeni dhe çfarë materialesh keni ose kërkoni. Një person nga ECONERA ju përgjigjet me email.", "Tell us who you are and which materials you have or need. A person at ECONERA will reply by email.")}</p>
      </section>
      <section className="container-x grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <LeadForm source="kontakt" />
        <aside className="space-y-4">
          <div className="card p-6 text-sm text-ink-2">
            <p className="font-semibold text-ink">{t("Pilot në Tiranë", "Tirana pilot")}</p>
            <p className="mt-1">{t("Objektivat për 12 muajt e parë:", "Goals for the first 12 months:")}</p>
            <ul className="mt-3 grid gap-2">
              {goals.map(([n, sq, en]) => <li key={en} className="flex items-baseline gap-2"><span className="display text-2xl text-lime-dim dark:text-lime">{n}</span>{t(sq, en)}</li>)}
            </ul>
          </div>
          <div className="card p-6 text-sm text-ink-2">
            <p className="font-semibold text-ink">{t("Kanale të tjera", "Other ways to reach us")}</p>
            {email && <p className="mt-2">{t("Email:", "Email:")} <a className="text-ink underline underline-offset-4" href={`mailto:${email}`}>{email}</a></p>}
            <p className="mt-2">{t("Problem me një porosi ose listim? ", "A problem with an order or listing? ")}<Link className="text-ink underline underline-offset-4" href="/mbrojtja">{t("Mbrojtja e klientit", "Customer Protection")}</Link></p>
            <p className="mt-2">{t("Partneritete: ", "Partnerships: ")}<Link className="text-ink underline underline-offset-4" href="/partneret#apliko">{t("apliko këtu", "apply here")}</Link></p>
          </div>
        </aside>
      </section>
    </>
  );
}
