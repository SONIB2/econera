"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitRoadmapInterest, type LeadState } from "@/app/(site)/actions";
import { useLang } from "@/components/lang-provider";
import { INTEREST_OPTIONS, shortName, STATUS } from "@/lib/roadmap";

/** Register interest in upcoming products. It records interest only; it is not a pre-order or a promise of a date. */
export function InterestForm({ preselect }: { preselect?: string }) {
  const { t, lang } = useLang();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitRoadmapInterest, { status: "idle" });

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center text-ink" role="status">
        <p className="mx-auto grid size-12 place-items-center rounded-full bg-lime text-bg" aria-hidden>✓</p>
        <h3 className="mt-4 text-2xl font-semibold">{t("Interesi u regjistrua.", "Interest registered.")}</h3>
        <p className="mx-auto mt-2 max-w-md text-ink-2">{t("Do t'ju shkruajmë kur produkti që zgjodhët të jetë gati për t'u provuar.", "We will write to you when a product you chose is ready to try.")}</p>
      </div>
    );
  }
  const err = (k: string) => state.errors?.[k] && (lang === "en" ? "Please check this field." : state.errors[k]);
  const v = state.values ?? {};
  const picked = new Set((v.products ?? preselect ?? "").split(",").filter(Boolean));
  const field = "h-11 w-full min-w-0 rounded-xl border border-line bg-bg-2 px-3.5 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none";
  const input = (name: string, label: string, opts: { type?: string; required?: boolean; auto?: string; def?: string } = {}) => (
    <label className="grid gap-1.5 text-sm">
      <span>{label}{!opts.required && <span className="text-ink-2"> ({t("opsionale", "optional")})</span>}</span>
      <input name={name} type={opts.type ?? "text"} required={opts.required} autoComplete={opts.auto} defaultValue={v[name] ?? opts.def} aria-invalid={Boolean(err(name))} className={field} />
      {err(name) && <span className="text-xs text-lime-dim">{err(name)}</span>}
    </label>
  );
  const roles: [string, string][] = [
    ["kontraktor", t("Kompani ndërtimi ose kontraktor", "Construction company or contractor")],
    ["furnitor", t("Furnitor, depo ose prodhues", "Supplier, warehouse or manufacturer")],
    ["zhvillues", t("Zhvillues, arkitekt ose investitor", "Developer, architect or investor")],
    ["transportues", t("Logjistikë dhe transport", "Logistics and transport")],
    ["tjeter", t("Tjetër", "Other")],
  ];

  return (
    <form key={state.attempt ?? 0} action={action} className="grid gap-5 rounded-2xl border border-line bg-card p-5 text-ink md:p-7" noValidate>
      <div aria-hidden className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{t("Për cilat produkte keni interes?", "Which products are you interested in?")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {INTEREST_OPTIONS.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-bg-2 px-3.5 py-2.5 text-sm has-[:checked]:border-lime">
              <input type="checkbox" name="products" value={p.id} defaultChecked={picked.has(p.id)} className="size-4 shrink-0 accent-[var(--color-lime)]" />
              <span className="min-w-0 flex-1">{shortName(p.name)}</span>
              <span className="text-xs text-ink-2">{STATUS[p.status].label[lang]}</span>
            </label>
          ))}
        </div>
        {err("products") && <span className="text-xs text-lime-dim">{lang === "en" ? "Choose at least one product." : state.errors?.products}</span>}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {input("contact", t("Emri", "Name"), { required: true, auto: "name" })}
        {input("email", "Email", { type: "email", required: true, auto: "email" })}
        {input("company", t("Organizata", "Organisation"), { auto: "organization" })}
        <label className="grid gap-1.5 text-sm">
          <span>{t("Roli juaj", "Your role")}</span>
          <select name="role" defaultValue={v.role ?? "kontraktor"} className={field}>{roles.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        {input("city", t("Qyteti", "City"), { required: true, auto: "address-level2", def: "Tiranë" })}
      </div>
      <label className="grid gap-1.5 text-sm">
        <span>{t("Çfarë do t'ju ndihmonte më shumë?", "What would help you most?")} <span className="text-ink-2">({t("opsionale", "optional")})</span></span>
        <textarea name="note" rows={3} maxLength={600} defaultValue={v.note} className="rounded-xl border border-line bg-bg-2 px-3.5 py-3 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none"
          placeholder={t("P.sh. si i ndiqni sot tenderat ose stokun…", "E.g. how you track tenders or stock today…")} />
      </label>
      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="consent" required defaultChecked={v.consent === "on"} className="mt-0.5 size-5 shrink-0 accent-[var(--color-lime)]" />
        <span>{t("Pranoj që ECONERA t'i ruajë këto të dhëna për të më njoftuar për këto produkte, sipas ", "I agree that ECONERA may store these details to update me about these products, as described in the ")}<Link href="/privatesia" className="text-ink underline underline-offset-4">{t("politikës së privatësisë", "privacy policy")}</Link>.</span>
      </label>
      {err("consent") && <p className="-mt-3 text-xs text-lime-dim">{err("consent")}</p>}
      {state.status === "error" && <p role="alert" className="rounded-xl border border-lime/40 bg-lime/5 px-4 py-3 text-sm">{lang === "en" ? "Nothing was sent. Check the marked fields and try again." : state.message}</p>}
      <p className="text-xs text-ink-2">{t("Ky është regjistrim interesi, jo porosi. Nuk ka pagesë dhe nuk premtohet datë publikimi.", "This registers interest only. It is not an order, there is no payment and no release date is promised.")}</p>
      <button type="submit" disabled={pending} className="btn-primary h-12 w-full disabled:opacity-60 sm:w-fit sm:px-8">{pending ? t("Duke dërguar…", "Sending…") : t("Regjistro interesin", "Register interest")}</button>
    </form>
  );
}
