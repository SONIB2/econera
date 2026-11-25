import Link from "next/link";
import { signIn, signUp } from "@/app/(legacy)/account-actions";
import { messages } from "@/components/ui";
import { ROLES, type AccountRole } from "@/lib/account-role";
import { SUPPLIER_PLANS } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import { supabaseSettings } from "@/lib/supabase";

type Props = { mode: "login" | "register"; status?: string; role?: string; plan?: string; availability?: string; quotation?: string };

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink placeholder:text-ink-2/60 focus:border-lime focus:outline-none";

export function AuthForm({ mode, status, role, plan, availability, quotation }: Props) {
  const configured = Boolean(supabaseSettings());
  const shown = !configured ? "unavailable" : status;
  const notice = shown && Object.hasOwn(messages, shown) ? messages[shown] : null;
  const selected: AccountRole = role === "furnitor" ? "furnitor" : "bleres";
  const selectedPlan = SUPPLIER_PLANS.some((p) => p.id === plan) ? plan : "falas";
  const register = mode === "register";

  return (
    <section className="container-x grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div className="lg:sticky lg:top-28">
        <p className="eyebrow">{register ? "Llogari e re" : "Llogaria"}</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">{register ? "Krijo llogarinë." : "Mirë se u ktheve."}</h1>
        <p className="lead mt-5 max-w-md">{register ? "Zgjidh si do ta përdorësh ECONERA. Blerësit hyjnë falas; furnitorët nisin falas dhe zgjedhin planin kur rriten." : "Furnitorët hapin panelin e stokut. Blerësit vazhdojnë te Tregu."}</p>
        <ul className="mt-8 grid gap-3 text-sm text-ink-2">
          <li className="flex gap-3"><span className="text-lime">●</span>Blerës: kërkim me AI, oferta dhe certifikata, falas përgjithmonë.</li>
          <li className="flex gap-3"><span className="text-lime">●</span>Furnitor: regjistro stokun me foto, merr kërkesa, shit tepricat. <Link href="/cmimet" className="text-lime underline-offset-4 hover:underline">Shiko çmimet</Link></li>
        </ul>
      </div>

      <form action={register ? signUp : signIn} className="card grid gap-5 p-6 md:p-8">
        {!register && typeof availability === "string" && <input type="hidden" name="availability" value={availability} />}
        {!register && typeof quotation === "string" && <input type="hidden" name="quotation" value={quotation} />}

        {register ? (
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">Lloji i llogarisë</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES.map((r) => (
                <label key={r.id} className="group cursor-pointer rounded-xl border border-line bg-bg p-4 transition has-[:checked]:border-lime has-[:checked]:bg-lime/[0.07]">
                  <input type="radio" name="role" value={r.id} defaultChecked={selected === r.id} className="sr-only" />
                  <span className="flex items-center justify-between font-semibold">{r.title}<span className="h-4 w-4 rounded-full border border-line group-has-[:checked]:border-[5px] group-has-[:checked]:border-lime" aria-hidden /></span>
                  <span className="mt-1 block text-sm text-ink-2">{r.text}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink-2">Një hyrje për blerës dhe furnitorë. Pas hyrjes të çojmë automatikisht: furnitorët te paneli i stokut, blerësit te Tregu.</p>
        )}

        {register && (
          <label className="grid gap-2 text-sm" data-supplier-only>
            <span className="font-medium">Plani për furnitorë <span className="text-ink-2">(ndryshohet kurdo)</span></span>
            <select name="plan" defaultValue={selectedPlan} className={input}>
              {SUPPLIER_PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}: {p.monthly ? `${formatNumber(p.monthly, 0)} lekë/muaj` : "0 lekë"} · komision {p.commission}</option>)}
            </select>
            <span className="text-xs text-ink-2">Vlen vetëm për furnitorët. Blerësit nuk paguajnë.</span>
          </label>
        )}

        <label className="grid gap-2 text-sm"><span className="font-medium">Email</span><input name="email" type="email" autoComplete="email" required maxLength={254} className={input} placeholder="emri@kompania.al" /></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">Fjalëkalimi</span><input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={12} maxLength={72} className={input} />{register && <span className="text-xs text-ink-2">Të paktën 12 karaktere.</span>}</label>

        {notice && <p role="status" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{notice}</p>}
        <button className="btn-primary w-full" disabled={!configured}>{register ? "Regjistrohu" : "Hyr"}</button>
        <div className="flex flex-wrap justify-between gap-3 text-sm text-ink-2">
          {register ? <Link href="/hyr" className="hover:text-ink">Ke llogari? Hyr</Link> : <><Link href="/regjistrohu" className="hover:text-ink">Krijo llogari</Link><Link href="/fjalekalimi" className="hover:text-ink">Harrove fjalëkalimin?</Link></>}
          {register && <span>Duke u regjistruar pranon <Link href="/privatesia" className="underline underline-offset-4">privatësinë</Link>.</span>}
        </div>
      </form>
    </section>
  );
}
