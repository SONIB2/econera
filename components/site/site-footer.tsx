"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/lang-provider";
import { BookIcon, BuildingIcon, GlobeIcon, GrowthIcon, LeafIcon, MailIcon, MarketIcon, PinIcon, VerifyIcon } from "./tool-icons";

/** Official social profiles only. Add a row here when a new official account exists; nothing else renders. */
const SOCIAL = [
  { href: "https://www.instagram.com/econera.al/", label: "Instagram @econera.al", d: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" /></> },
];

/**
 * GlobalFooter: the one footer used on every public page. Five compact columns on desktop,
 * brand + accordions on phones, and a thin legal bar. Contact details come from configuration
 * (PILOT_CONTACT_EMAIL); without it the contact form is linked instead. No invented details.
 */
export function SiteFooter({ email }: { email?: string }) {
  const { t } = useLang();
  const cols: { title: string; Icon: (p: { className?: string }) => React.ReactElement; links: [string, string][] }[] = [
    { title: t("Platforma", "Platform"), Icon: MarketIcon, links: [["/treg", t("Tregu", "Marketplace")], ["/shit", t("Shit materiale", "Sell Materials")], ["/ai", t("Mjetet AI", "AI Tools")], ["/verify", "ECONERA Verify"], ["/biznes", t("Për bizneset", "For Business")]] },
    { title: t("Burime", "Resources"), Icon: BookIcon, links: [["/ai#bashke", t("Si funksionon", "How it works")], ["/cmimet", t("Planet dhe çmimet", "Plans & Pricing")], ["/kontakt", t("Mbështetja", "Support")], ["/mbrojtja", t("Qendra e ndihmës", "Help Center")]] },
    { title: t("Kompania", "Company"), Icon: BuildingIcon, links: [["/rreth-nesh", t("Rreth ECONERA", "About ECONERA")], ["/partneret", t("Partnerët", "Our Partners")], ["/partneret#apliko", t("Bëhu partner", "Become a Partner")], ["/kontakt", t("Kontakt", "Contact")]] },
  ];
  const contact: { Icon: (p: { className?: string }) => React.ReactElement; node: React.ReactNode }[] = [
    { Icon: MailIcon, node: email ? <a className="hover:text-white" href={`mailto:${email}`}>{email}</a> : <Link className="hover:text-white" href="/kontakt">{t("Formulari i kontaktit", "Contact form")}</Link> },
    { Icon: PinIcon, node: t("Tiranë, Shqipëri", "Tirana, Albania") },
    { Icon: GlobeIcon, node: <a className="hover:text-white" href="https://www.econera.al">www.econera.al</a> },
  ];
  const legal: [string, string][] = [
    ["/privatesia", t("Privatësia", "Privacy Policy")], ["/kushtet", t("Kushtet e përdorimit", "Terms & Conditions")], ["/cookies", t("Politika e cookies", "Cookie Policy")],
    ["/qasshmeria", t("Aksesueshmëria", "Accessibility")], ["/mbrojtja", t("Mbrojtja e klientit", "Customer Protection")],
  ];
  const values = [
    { Icon: VerifyIcon, label: t("Listime të shqyrtuara nga njerëz", "Human-reviewed listings") },
    { Icon: LeafIcon, label: t("Ndërtim qarkullues", "Circular Construction") },
    { Icon: GrowthIcon, label: t("Praktika të qëndrueshme", "Sustainable Practices") },
  ];
  const head = "flex items-center gap-2 text-[14px] font-semibold text-[#c8f169]";
  const link = "text-[13.5px] text-white/70 transition-colors hover:text-white focus-visible:text-white";
  const list = (links: [string, string][]) => <ul className="grid gap-2">{links.map(([href, label]) => <li key={href + label}><Link className={link} href={href}>{label}</Link></li>)}</ul>;
  const contactList = <ul className="grid gap-2 text-[13.5px] text-white/70">{contact.map(({ Icon, node }, i) => <li key={i} className="flex items-center gap-2.5"><Icon className="size-4 shrink-0 text-white/75" />{node}</li>)}</ul>;

  return (
    <footer data-global-footer className="theme-dark border-t border-white/10 bg-[#062321] pb-20 text-ink md:pb-0">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="grid gap-6 py-7 md:grid-cols-[1.35fr_repeat(4,1fr)] md:gap-8 md:py-8">
          <div className="md:border-r md:border-white/10 md:pr-8">
            <Image src="/brand/logo-dark.svg" alt="ECONERA" width={481} height={66} className="h-[22px] w-auto" />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/72">{t("Platforma inteligjente për ndërtimin qarkullues. Bli, shit, dizajno dhe optimizo materialet me AI.", "The intelligent platform for circular construction. Buy, sell, design and optimize materials with AI.")}</p>
            <ul className="mt-4 flex gap-2">
              {SOCIAL.map((s) => (
                <li key={s.href}><a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid size-8 place-items-center rounded-full border border-white/15 text-white/85 transition hover:border-[#c8f169] hover:text-[#c8f169] focus-visible:border-[#c8f169]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>{s.d}</svg>
                </a></li>
              ))}
            </ul>
          </div>

          {/* Desktop columns */}
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title} className="hidden md:block">
              <p className={head}><c.Icon className="size-[18px]" />{c.title}</p>
              <div className="mt-3.5">{list(c.links)}</div>
            </nav>
          ))}
          <div className="hidden md:block">
            <p className={head}><MailIcon className="size-[18px]" />{t("Na kontaktoni", "Contact us")}</p>
            <div className="mt-3.5">{contactList}</div>
          </div>

          {/* Phone accordions */}
          <div className="divide-y divide-white/10 border-y border-white/10 md:hidden">
            {[...cols.map((c) => ({ title: c.title, Icon: c.Icon, body: list(c.links) })), { title: t("Na kontaktoni", "Contact us"), Icon: MailIcon, body: contactList }].map((c) => (
              <details key={c.title} className="group">
                <summary className={`${head} min-h-12 cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                  <c.Icon className="size-[18px]" />{c.title}
                  <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="ml-auto text-white/50 transition group-open:rotate-180"><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
                </summary>
                <div className="pb-4 pl-[26px] [&_a]:inline-block [&_a]:py-1">{c.body}</div>
              </details>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-4 text-xs text-white/60 lg:flex-row lg:items-center lg:justify-between lg:gap-6 md:pr-16">
          <p className="shrink-0">© {new Date().getFullYear()} ECONERA. {t("Të gjitha të drejtat e rezervuara.", "All rights reserved.")}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label={t("Parimet tona", "Our principles")}>
            {values.map(({ Icon, label }) => <li key={label} className="flex items-center gap-1.5 text-white/70"><Icon className="size-4 text-[#c8f169]" />{label}</li>)}
          </ul>
          <nav aria-label={t("Ligjore", "Legal")}>
            <ul className="flex flex-wrap gap-x-1 gap-y-1">
              {legal.map(([href, label], i) => <li key={href} className="flex items-center">{i > 0 && <span aria-hidden className="mx-1.5 h-3 w-px bg-white/20" />}<Link className="py-1 transition-colors hover:text-white focus-visible:text-white" href={href}>{label}</Link></li>)}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
