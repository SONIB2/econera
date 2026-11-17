"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/(site)/actions";

const ROLES = { furnitor: "Furnitor / depo", kontraktor: "Kontraktor", transportues: "Transportues", zhvillues: "Zhvillues / investitor", tjeter: "Tjetër" };
const INTERESTS = { ka: "Kam stok për të shitur", kerkon: "Kërkoj materiale", te_dyja: "Të dyja" };

export function LeadForm({ source, defaultRole = "kontraktor", defaultInterest = "kerkon" }: { source: "kontakt" | "furnitore"; defaultRole?: keyof typeof ROLES; defaultInterest?: keyof typeof INTERESTS }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: "idle" });

  if (state.status === "ok") {
    return (
      <div className="card p-8 text-center" role="status">
        <p className="mx-auto grid size-12 place-items-center rounded-full bg-lime text-bg" aria-hidden="true">✓</p>
        <h2 className="display mt-5 text-3xl">Faleminderit.</h2>
        <p className="lead mx-auto mt-3 max-w-md text-base">Ju regjistruam për pilotin. Ju kontaktojmë brenda disa ditësh.</p>
      </div>
    );
  }

  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form key={state.attempt ?? 0} action={action} className="card grid gap-5 p-6 md:p-8" noValidate>
      <input type="hidden" name="source" value={source} />
      <div aria-hidden="true" className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="company" defaultValue={v.company} label="Kompania" error={e.company} required autoComplete="organization" />
        <Field name="nipt" defaultValue={v.nipt} label="NIPT (opsional)" error={e.nipt} placeholder="L12345678A" />
        <Field name="contact" defaultValue={v.contact} label="Personi i kontaktit" error={e.contact} required autoComplete="name" />
        <Field name="email" defaultValue={v.email} label="Email" type="email" error={e.email} required autoComplete="email" />
        <Field name="phone" defaultValue={v.phone} label="Telefon (opsional)" type="tel" error={e.phone} autoComplete="tel" />
        <Field name="city" label="Qyteti" error={e.city} required defaultValue={v.city ?? "Tiranë"} autoComplete="address-level2" />
        <Choice name="role" label="Roli" options={ROLES} defaultValue={v.role ?? defaultRole} error={e.role} />
        <Choice name="interest" label="Interesi" options={INTERESTS} defaultValue={v.interest ?? defaultInterest} error={e.interest} />
      </div>

      <label className="grid gap-1.5 text-sm">
        <span>Çfarë materialesh keni ose kërkoni?</span>
        <textarea name="materials" defaultValue={v.materials} rows={4} required maxLength={1000} aria-invalid={Boolean(e.materials)} aria-describedby={e.materials ? "materials-err" : undefined}
          placeholder="P.sh. 2,000 tulla me vrima në depo në Kamëz, 80 m² pllaka granit…" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none" />
        {e.materials && <span id="materials-err" className="text-xs text-lime">{e.materials}</span>}
      </label>

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="consent" required defaultChecked={v.consent === "on"} className="mt-0.5 size-5 shrink-0 accent-[var(--color-lime)]" aria-invalid={Boolean(e.consent)} />
        <span>Pranoj që ECONERA të ruajë këto të dhëna për t&apos;u kontaktuar rreth pilotit, sipas <Link href="/privatesia" className="text-ink underline underline-offset-4">politikës së privatësisë</Link>. Mund të kërkoj fshirjen e tyre në çdo kohë.</span>
      </label>
      {e.consent && <p className="-mt-3 text-xs text-lime">{e.consent}</p>}

      {state.status === "error" && state.message && <p role="alert" className="rounded-xl border border-lime/40 bg-lime/5 px-4 py-3 text-sm">{state.message}</p>}

      <button type="submit" disabled={pending} className="btn-primary h-12 w-full sm:w-fit sm:px-8 disabled:opacity-60">{pending ? "Duke dërguar…" : "Regjistrohu për pilotin"}</button>
    </form>
  );
}

function Field({ name, label, error, ...props }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span>{label}</span>
      <input name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-err` : undefined} {...props}
        className="h-12 rounded-xl border border-line bg-bg-2 px-4 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none" />
      {error && <span id={`${name}-err`} className="text-xs text-lime">{error}</span>}
    </label>
  );
}

function Choice({ name, label, options, defaultValue, error }: { name: string; label: string; options: Record<string, string>; defaultValue: string; error?: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-12 rounded-xl border border-line bg-bg-2 px-4 text-ink focus:border-lime focus:outline-none">
        {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {error && <span className="text-xs text-lime">{error}</span>}
    </label>
  );
}
