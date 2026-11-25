import { redirect } from "next/navigation";
import { enrollMfa, verifyMfa } from "@/app/(site)/admin/actions";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { currentStaff } from "@/lib/verify/staff";

export default async function Mfa({ searchParams }: { searchParams: Promise<{ factor?: string; qr?: string; secret?: string; r?: string }> }) {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const s = await currentStaff();
  if (s.kind === "anonymous") redirect("/hyr");
  if (s.kind !== "staff") redirect("/admin/pa-akses");
  if (s.mfa) redirect("/admin");
  const p = await searchParams;
  const { data: factors } = await s.db.auth.mfa.listFactors();
  const verified = factors?.totp.find((f) => f.status === "verified");
  const factor = p.factor ?? verified?.id;
  return (
    <div className="card grid max-w-xl gap-4 p-7">
      <h1 className="display text-4xl">{t("Verifikim me dy hapa", "Two-step verification")}</h1>
      <p className="text-ink-2">{t("Stafi i ECONERA-s duhet të përdorë MFA. Përdor Google Authenticator, Microsoft Authenticator ose 1Password.", "ECONERA staff must use MFA. Use Google Authenticator, Microsoft Authenticator or 1Password.")}</p>
      {p.r === "code" && <p role="alert" className="rounded-xl border border-[#e8b7a8] bg-[#fdf0ec] px-4 py-3 text-sm">{t("Kodi nuk është i saktë. Provo përsëri.", "The code is not correct. Try again.")}</p>}
      {p.qr && (
        <div className="grid gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.qr} alt={t("Kodi QR për aplikacionin e autentikimit", "QR code for the authenticator app")} className="size-48 rounded-lg border border-line bg-white p-2" />
          <p className="text-xs text-ink-2">{t("Ose fut kodin", "Or enter the key")}: <code className="break-all">{p.secret}</code></p>
        </div>
      )}
      {factor ? (
        <form action={verifyMfa} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="factor" value={factor} />
          <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Kodi 6-shifror", "6-digit code")}</span><input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required className="w-40 rounded-lg border border-line bg-bg px-3 py-2.5 text-lg tracking-widest" /></label>
          <button className="btn-primary">{t("Verifiko", "Verify")}</button>
        </form>
      ) : (
        <form action={enrollMfa}><button className="btn-primary">{t("Aktivizo MFA", "Set up MFA")}</button></form>
      )}
    </div>
  );
}
