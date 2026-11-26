import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import "./(site)/site.css";

export default async function NotFound() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div className="max-w-md">
        <p className="eyebrow">404</p>
        <h1 className="display mt-4 text-5xl">{t("Faqja nuk u gjet.", "Page not found.")}</h1>
        <p className="lead mt-4">{t("Ndoshta materiali është tërhequr ose lidhja ka ndryshuar.", "The material may have been withdrawn, or the link has changed.")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-primary">{t("Kryefaqja", "Home")}</Link>
          <Link href="/treg" className="btn-ghost">{t("Tregu", "Marketplace")}</Link>
        </div>
      </div>
    </main>
  );
}
