"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/(site)/actions";
import { useLang } from "@/components/lang-provider";

/** Partnership application. Stored with the other leads (source "partner") and read by staff in the admin area. */
export function PartnerForm() {
  const { t, lang } = useLang();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: "idle" });
  const types: [string, string][] = [
    ["furnitor", t("Furnitor ose prodhues", "Supplier or manufacturer")],
    ["kontraktor", t("Kompani ndërtimi ose kontraktor", "Construction company or contractor")],
    ["zhvillues", t("Zhvillues, arkitekt ose investitor", "Developer, architect or investor")],
    ["transportues", t("Logjistikë dhe transport", "Logistics and transport")],
    ["tjeter", t("Institucion, organizatë ose tjetër", "Institution, organisation or other")],
  ];

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center text-ink" role="status">
        <p className="mx-auto grid size-12 place-items-center rounded-full bg-lime text-bg" aria-hidden>✓</p>
        <h3 className="mt-4 text-2xl font-semibold">{t("Aplikimi u dërgua.", "Application sent.")}</h3>
        <p className="mx-auto mt-2 max-w-md text-ink-2">{t("Një person nga ECONERA e shqyrton dhe ju kontakton me email.", "A person at ECONERA will review it and contact you by email.")}</p>
      </div>
    );
  }
  // Server messages are written in Albanian; in English show a short neutral hint instead.
  const err = (k: string) => state.errors?.[k] && (lang === "en" ? "Please check this field." : state.errors[k]);
  const v = state.values ?? {};
  const field = "h-11 rounded-xl border border-line bg-bg-2 px-3.5 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none";
  const f = ({ name, label, type = "text", required, auto, def }: { name: string; label: string; type?: string; required?: boolean; auto?: string; def?: string }) => (
    <label key={name} className="grid gap-1.5 text-sm">
      <span>{label}{!required && <span className="text-ink-2"> ({t("opsionale", "optional")})</span>}</span>
      <input name={name} type={type} required={required} autoComplete={auto} defaultValue={v[name] ?? def} aria-invalid={Boolean(err(name))} className={field} />
      {err(name) && <span className="text-xs text-lime-dim">{err(name)}</span>}
    </label>
  );

  return (
    <form key={state.attempt ?? 0} action={action} className="grid gap-4 rounded-2xl border border-line bg-card p-5 text-ink md:p-7" noValidate>
      <input type="hidden" name="source" value="partner" />
      <input type="hidden" name="interest" value="te_dyja" />
      <div aria-hidden className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {f({ name: "company", label: t("Organizata", "Organisation"), required: true, auto: "organization" })}
        <label className="grid gap-1.5 text-sm">
          <span>{t("Lloji i partnerit", "Partner type")}</span>
          <select name="role" defaultValue={v.role ?? "furnitor"} className={field}>{types.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        {f({ name: "contact", label: t("Personi i kontaktit", "Contact person"), required: true, auto: "name" })}
        {f({ name: "email", label: "Email", type: "email", required: true, auto: "email" })}
        {f({ name: "phone", label: t("Telefon", "Phone"), type: "tel", auto: "tel" })}
        {f({ name: "city", label: t("Qyteti", "City"), required: true, auto: "address-level2", def: "Tiranë" })}
        {f({ name: "nipt", label: "NIPT" })}
      </div>
      <label className="grid gap-1.5 text-sm">
        <span>{t("Si do të donit të bashkëpunonim?", "How would you like to work together?")}</span>
        <textarea name="materials" rows={4} required maxLength={1000} defaultValue={v.materials} aria-invalid={Boolean(err("materials"))}
          placeholder={t("P.sh. listimi i katalogut tonë, pika grumbullimi për materiale të rikuperuara, projekt pilot…", "E.g. listing our catalogue, a collection point for reclaimed materials, a pilot project…")}
          className="rounded-xl border border-line bg-bg-2 px-3.5 py-3 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none" />
        {err("materials") && <span className="text-xs text-lime-dim">{err("materials")}</span>}
      </label>
      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="consent" required defaultChecked={v.consent === "on"} className="mt-0.5 size-5 shrink-0 accent-[var(--color-lime)]" />
        <span>{t("Pranoj që ECONERA t'i ruajë këto të dhëna për të më kontaktuar rreth partneritetit, sipas ", "I agree that ECONERA may store these details to contact me about a partnership, as described in the ")}<Link href="/privatesia" className="text-ink underline underline-offset-4">{t("politikës së privatësisë", "privacy policy")}</Link>.</span>
      </label>
      {err("consent") && <p className="-mt-2 text-xs text-lime-dim">{err("consent")}</p>}
      {state.status === "error" && <p role="alert" className="rounded-xl border border-lime/40 bg-lime/5 px-4 py-3 text-sm">{lang === "en" ? "The application was not sent. Check the marked fields and try again." : state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary h-12 w-full disabled:opacity-60 sm:w-fit sm:px-8">{pending ? t("Duke dërguar…", "Sending…") : t("Dërgo aplikimin", "Send application")}</button>
    </form>
  );
}
