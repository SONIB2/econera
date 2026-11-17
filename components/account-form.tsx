import Link from "next/link";
import { BrandArtwork } from "@/components/brand";
import { requestRecovery, signIn, signUp, updatePassword } from "@/app/(legacy)/account-actions";
import { Field, Notice, PageIntro } from "@/components/ui";
import { supabaseSettings } from "@/lib/supabase";

const screens = {
  login: { title: "Hyr në ECONERA", action: signIn, button: "Hyr", description: "Hap panelin dhe vazhdo punën aty ku e le." },
  register: { title: "Krijo llogarinë", action: signUp, button: "Regjistrohu", description: "Përgatit skica dhe dërgo materialet për shqyrtim." },
  recovery: { title: "Rikthe hyrjen", action: requestRecovery, button: "Dërgo lidhjen", description: "Shkruaj adresën e emailit të llogarisë." },
  update: { title: "Ndrysho fjalëkalimin", action: updatePassword, button: "Ruaj fjalëkalimin", description: "Përdor një fjalëkalim të ri me të paktën 12 karaktere." },
};

export function AccountForm({ mode, status, availability, quotation }: { mode: keyof typeof screens; status?: string; availability?: string; quotation?: string }) {
  const screen = screens[mode];
  const configured = Boolean(supabaseSettings());

  return <div className="container narrow section">
    <BrandArtwork className="account-brand" />
    <PageIntro eyebrow="LLOGARIA" title={screen.title}>{screen.description}</PageIntro>
    <Notice status={!configured ? "unavailable" : status} />
    <form className="panel stack" action={screen.action}>
      {mode === "login" && typeof availability === "string" && <input type="hidden" name="availability" value={availability} />}
      {mode === "login" && typeof quotation === "string" && <input type="hidden" name="quotation" value={quotation} />}
      {mode !== "update" && <Field label="Email"><input name="email" type="email" autoComplete="email" required maxLength={254} /></Field>}
      {mode !== "recovery" && <Field label="Fjalëkalimi"><input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={12} maxLength={72} aria-describedby={mode === "register" ? "password-hint" : undefined} /></Field>}
      {mode === "register" && <p className="muted" id="password-hint">Të paktën 12 karaktere.</p>}
      {mode === "update" && <Field label="Përsërit fjalëkalimin"><input name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={72} /></Field>}
      <button className="button" disabled={!configured}>{screen.button}</button>
      <div className="actions">
        {mode === "login" ? <><Link href="/regjistrohu">Krijo llogari</Link><Link href="/fjalekalimi">Harrove fjalëkalimin?</Link></> : <Link href="/hyr">Kthehu te hyrja</Link>}
      </div>
    </form>
  </div>;
}
