import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { applicationOrigin } from "@/lib/supabase";
import { formatMoney, isLocale, otherLocale } from "@/lib/i18n";
import { demoLot, showcaseCopy, steps } from "@/lib/showcase";
import "./showcase.css";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ step?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = showcaseCopy[locale].overview;
  const origin = applicationOrigin();
  const url = (language: string) => new URL(`/${language}/platform`, origin ?? "http://127.0.0.1:3000").href;
  return {
    title: copy.title,
    description: copy.description,
    alternates: origin ? { canonical: url(locale), languages: { sq: url("sq"), en: url("en"), "x-default": url("sq") } } : undefined,
  };
}

export default async function Platform({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { step } = await searchParams;
  const index = steps.findIndex(({ id }) => id === step);
  const current = steps[index];
  const copy = showcaseCopy[locale];
  const path = `/${locale}/platform`;
  const stepPath = (id: string) => `${path}?step=${id}#tour`;
  const alternate = otherLocale(locale);
  const alternatePath = `/${alternate}/platform${current ? `?step=${current.id}#tour` : ""}`;
  const pilotEmail = process.env.PILOT_CONTACT_EMAIL;
  const pilotHref = pilotEmail && /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(pilotEmail) ? `mailto:${pilotEmail}` : null;
  const sections = [
    [copy.overview.problemTitle, copy.overview.problem],
    [copy.overview.technologyTitle, copy.overview.technology],
    [copy.overview.usersTitle, copy.overview.users],
    [copy.overview.circularTitle, copy.overview.circular],
    [copy.overview.accessTitle, copy.overview.access],
  ];

  return <div className="container showcase">
    <div className="showcase-language">
      <span aria-current="true" lang={locale}>{locale === "sq" ? "Shqip" : "English"}</span>
      <a href={alternatePath} hrefLang={alternate} lang={alternate}>{alternate === "en" ? "English" : "Shqip"}</a>
    </div>
    {current ? <div id="tour" className="showcase-tour" tabIndex={-1}>
      <div>
        <Link className="text-link" href={path}>{copy.shell.demo}</Link>
        <h1>{copy.tour.title}</h1>
        <p>{copy.tour.description}</p>
      </div>
      <div className="showcase-step-layout">
        <nav aria-label={copy.tour.index}>
          <ol className="showcase-index">
            {steps.map(({ id }) => <li key={id}><Link href={stepPath(id)} aria-current={id === current.id ? "step" : undefined}>{copy.steps[id][0]}</Link></li>)}
          </ol>
        </nav>
        <section className="showcase-step">
          <span className="showcase-status" data-status={current.status}>{copy.statuses[current.status]}</span>
          <h2>{copy.steps[current.id][0]}</h2>
          <p>{copy.steps[current.id][1]}</p>
          {["world", "house", "material"].includes(current.id) && <Image className="showcase-preview" src={current.id === "material" ? "/masonry/clay.webp" : "/story-opening.webp"} alt="" width={850} height={350} />}
          {["record", "quote", "order"].includes(current.id) && <div className="showcase-fixture">
            <p>{copy.tour.fixture}</p>
            <dl>
              <div><dt>{copy.tour.quantity}</dt><dd>{new Intl.NumberFormat(locale).format(demoLot.quantity)} {copy.tour.pieces}</dd></div>
              <div><dt>{copy.tour.location}</dt><dd>{copy.tour.city}</dd></div>
              {current.id === "quote" && <div><dt>{copy.tour.price}</dt><dd>{formatMoney(demoLot.unitPrice, locale)}</dd></div>}
              {current.id === "order" && <div><dt>{copy.tour.total}</dt><dd>{formatMoney(demoLot.quantity * demoLot.unitPrice, locale)}</dd></div>}
            </dl>
          </div>}
          {"href" in current && <a className="text-link" href={current.href} hrefLang="sq">{copy.tour.open}</a>}
          <div className="showcase-step-actions">
            {index > 0 && <Link className="button secondary" href={stepPath(steps[index - 1].id)}>{copy.tour.previous}</Link>}
            {index < steps.length - 1 ? <Link className="button" href={stepPath(steps[index + 1].id)}>{copy.tour.next}</Link> : <Link className="button" href={path}>{copy.tour.finish}</Link>}
          </div>
        </section>
      </div>
    </div> : <>
      <section className="showcase-hero">
        <Image src="/story-opening.webp" fill sizes="(max-width: 750px) 100vw, 1250px" alt="" preload />
        <div className="showcase-hero-body">
          <h1>{copy.overview.title}</h1>
          <p>{copy.overview.description}</p>
          <Link className="button" href={stepPath(steps[0].id)}>{copy.overview.start}</Link>
        </div>
      </section>
      <div className="showcase-overview">
        <div className="showcase-explainer">
          {sections.map(([heading, description]) => <section key={heading}><h2>{heading}</h2><p>{description}</p></section>)}
        </div>
        <section className="showcase-product">
          <h2>{copy.overview.roadmap}</h2>
          <ul>{steps.map(({ id, status }) => <li key={id}><Link href={stepPath(id)}>{copy.steps[id][0]}</Link><span className="showcase-status" data-status={status}>{copy.statuses[status]}</span></li>)}</ul>
          {pilotHref ? <a className="button secondary" href={pilotHref}>{copy.overview.pilot}</a> : <p>{copy.overview.pilotUnavailable}</p>}
        </section>
      </div>
    </>}
  </div>;
}
