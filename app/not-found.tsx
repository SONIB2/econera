import Link from "next/link";
import "./(site)/site.css";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div className="max-w-md">
        <p className="eyebrow">404</p>
        <h1 className="display mt-4 text-5xl">Faqja nuk u gjet.</h1>
        <p className="lead mt-4">Ndoshta materiali është tërhequr ose lidhja ka ndryshuar.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-primary">Kryefaqja</Link>
          <Link href="/treg" className="btn-ghost">Tregu</Link>
        </div>
      </div>
    </main>
  );
}
