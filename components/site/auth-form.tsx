import Link from "next/link";
import { signIn, signUp } from "@/app/(legacy)/account-actions";
import { messages } from "@/components/ui";
import { ROLES, type AccountRole } from "@/lib/account-role";
import { SUPPLIER_PLANS } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import { supabaseSettings } from "@/lib/supabase";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { PLAN_NAME_EN } from "@/lib/pricing";

const NOTICE_EN: Record<string, string> = {
  unavailable: "The service is not configured yet.",
  invalid: "Check the form and try again.",
  credentials: "We could not sign you in. Check your email, password and account confirmation.",
  email: "If the address can be used, you will receive an email with instructions.",
  link: "The link has expired or cannot be used in this browser.",
  password: "Password changed. Please log in again.",
  failed: "The request failed. Please try again later.",
};

type Props = { mode: "login" | "register"; status?: string; role?: string; plan?: string; availability?: string; quotation?: string };

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none";

export async function AuthForm({ mode, status, role, plan, availability, quotation }: Props) {
  const configured = Boolean(supabaseSettings());
  const shown = !configured ? "unavailable" : status;
  const selected: AccountRole = role === "furnitor" ? "furnitor" : "bleres";
  const selectedPlan = SUPPLIER_PLANS.some((p) => p.id === plan) ? plan : "falas";
  const register = mode === "register";
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const supplier = role === "furnitor";
  const loginTitle = role === "furnitor" ? t("Hyr si furnitor.", "Supplier log in.") : role === "bleres" ? t("Hyr si blerës.", "Buyer log in.") : t("Mirë se u ktheve.", "Welcome back.");
  const registerTitle = role === "furnitor" ? t("Llogari furnitori.", "Supplier account.") : role === "bleres" ? t("Llogari blerësi, falas.", "Buyer account, free.") : t("Krijo llogarinë.", "Create your account.");
  const notice = shown && Object.hasOwn(messages, shown) ? (lang === "en" && NOTICE_EN[shown]) || messages[shown] : null;
  const roles = ROLES.map((r) => (lang === "en" ? { ...r, title: r.id === "bleres" ? "I'm a buyer" : "I'm a supplier", text: r.id === "bleres" ? "Contractor, firm or individual. I need materials. Free." : "Depot, manufacturer or construction company with surplus stock." } : r));

  return (
    <section className="container-x grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div className="lg:sticky lg:top-28">
        <p className="eyebrow">{register ? t("Llogari e re", "New account") : t("Llogaria", "Account")}</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">{register ? registerTitle : loginTitle}</h1>
        <p className="lead mt-5 max-w-md">{register ? t("Zgjidh si do ta përdorësh ECONERA. Blerësit hyjnë falas; furnitorët nisin falas dhe zgjedhin planin kur rriten.", "Choose how you will use ECONERA. Buyers join free; suppliers start free and pick a plan as they grow.") : supplier ? t("Hap panelin e stokut, kërkesat dhe porositë.", "Open your stock dashboard, requests and orders.") : t("Vazhdo te Tregu, ofertat dhe certifikatat e tua.", "Continue to the Market, your quotes and certificates.")}</p>
        <ul className="mt-8 grid gap-3 text-sm text-ink-2">
          <li className="flex gap-3"><span className="text-lime">●</span>{t("Blerës: kërkim me AI, oferta dhe certifikata, falas përgjithmonë.", "Buyer: AI search, quotes and certificates, free forever.")}</li>
          <li className="flex gap-3"><span className="text-lime">●</span>{t("Furnitor: regjistro stokun me foto, merr kërkesa, shit tepricat.", "Supplier: list stock with photos, get requests, sell surplus.")} <Link href="/cmimet" className="text-lime underline-offset-4 hover:underline">{t("Shiko çmimet", "See pricing")}</Link></li>
        </ul>
      </div>

      <form action={register ? signUp : signIn} className="card grid gap-5 p-6 md:p-8">
        {!register && typeof availability === "string" && <input type="hidden" name="availability" value={availability} />}
        {!register && typeof quotation === "string" && <input type="hidden" name="quotation" value={quotation} />}

        {register ? (
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">{t("Lloji i llogarisë", "Account type")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((r) => (
                <label key={r.id} className="group cursor-pointer rounded-xl border border-line bg-bg p-4 transition has-[:checked]:border-lime has-[:checked]:bg-lime/[0.07]">
                  <input type="radio" name="role" value={r.id} defaultChecked={selected === r.id} className="sr-only" />
                  <span className="flex items-center justify-between font-semibold">{r.title}<span className="h-4 w-4 rounded-full border border-line group-has-[:checked]:border-[5px] group-has-[:checked]:border-lime" aria-hidden /></span>
                  <span className="mt-1 block text-sm text-ink-2">{r.text}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink-2">{t("Një hyrje për blerës dhe furnitorë. Pas hyrjes të çojmë automatikisht: furnitorët te paneli i stokut, blerësit te Tregu.", "One login for buyers and suppliers. Afterwards we take you to the right place: suppliers to their stock dashboard, buyers to the Market.")}</p>
        )}

        {register && (
          <label className="grid gap-2 text-sm" data-supplier-only>
            <span className="font-medium">{t("Plani për furnitorë", "Supplier plan")} <span className="text-ink-2">{t("(ndryshohet kurdo)", "(change anytime)")}</span></span>
            <select name="plan" defaultValue={selectedPlan} className={input}>
              {SUPPLIER_PLANS.map((p) => <option key={p.id} value={p.id}>{lang === "en" ? PLAN_NAME_EN[p.id] : p.name}: {p.monthly ? `${formatNumber(p.monthly, 0)} ${t("lekë/muaj", "ALL/month")}` : t("0 lekë", "0 ALL")} · {t("komision", "commission")} {p.commission}</option>)}
            </select>
            <span className="text-xs text-ink-2">{t("Vlen vetëm për furnitorët. Blerësit nuk paguajnë.", "Suppliers only. Buyers never pay.")}</span>
          </label>
        )}

        <label className="grid gap-2 text-sm"><span className="font-medium">Email</span><input name="email" type="email" autoComplete="email" required maxLength={254} className={input} placeholder={t("emri@kompania.al", "name@company.com")} /></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">{t("Fjalëkalimi", "Password")}</span><input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={12} maxLength={72} className={input} />{register && <span className="text-xs text-ink-2">{t("Të paktën 12 karaktere.", "At least 12 characters.")}</span>}</label>

        {notice && <p role="status" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{notice}</p>}
        <button className="btn-primary w-full" disabled={!configured}>{register ? t("Regjistrohu", "Sign up") : t("Hyr", "Log in")}</button>
        <div className="flex flex-wrap justify-between gap-3 text-sm text-ink-2">
          {register ? <Link href="/hyr" className="hover:text-ink">{t("Ke llogari? Hyr", "Have an account? Log in")}</Link> : <><Link href="/regjistrohu" className="hover:text-ink">{t("Krijo llogari", "Create account")}</Link><Link href="/fjalekalimi" className="hover:text-ink">{t("Harrove fjalëkalimin?", "Forgot password?")}</Link></>}
          {register && <span>{t("Duke u regjistruar pranon", "By signing up you accept the")} <Link href="/privatesia" className="underline underline-offset-4">{t("privatësinë", "privacy policy")}</Link>.</span>}
        </div>
      </form>
    </section>
  );
}
