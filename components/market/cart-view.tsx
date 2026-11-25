"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useTransition } from "react";
import { sendCart, type CartResult } from "@/app/(site)/shporta/actions";
import { useLang } from "@/components/lang-provider";
import { cart, type CartItem, subscribeCart } from "@/lib/cart";
import { formatNumber } from "@/lib/format";

const snapshot = () => JSON.stringify(cart.items());

export function CartView() {
  const { t } = useLang();
  const raw = useSyncExternalStore(subscribeCart, snapshot, () => "[]");
  const items = JSON.parse(raw) as CartItem[];
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CartResult | null>(null);
  const [pending, start] = useTransition();
  const groups = new Map<string, CartItem[]>();
  for (const i of items) groups.set(i.seller || "—", [...(groups.get(i.seller || "—") ?? []), i]);
  const total = items.reduce((s, i) => s + i.priceLek * i.quantity, 0);
  const real = items.filter((i) => !i.demo);
  const demoCount = items.length - real.length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await sendCart({ items: real.map((i) => ({ id: i.id, quantity: i.quantity })), fulfillment, message });
      setResult(r);
      if (r.status === "done") r.sent.forEach((id) => cart.remove(id));
    });
  }

  if (result?.status === "done" && !items.length) return (
    <div className="card p-8 text-center">
      <h2 className="text-2xl">{t("Kërkesat u dërguan.", "Requests sent.")}</h2>
      <p className="mt-2 text-ink-2">{t(`${result.sent.length} kërkesa për ofertë u dërguan te shitësit. Do të njoftohesh kur të përgjigjen.`, `${result.sent.length} quote requests were sent to sellers. You'll be notified when they reply.`)}</p>
      <div className="mt-5 flex justify-center gap-2"><Link href="/inventari/ofertat" className="btn-primary">{t("Shiko ofertat", "View quotes")}</Link><Link href="/treg" className="btn-ghost">{t("Vazhdo kërkimin", "Keep browsing")}</Link></div>
    </div>
  );
  if (!items.length) return (
    <div className="card p-8 text-center">
      <h2 className="text-2xl">{t("Shporta është bosh.", "Your cart is empty.")}</h2>
      <p className="mt-2 text-ink-2">{t("Shto materiale nga tregu dhe dërgo kërkesat për ofertë njëherësh.", "Add materials from the marketplace and send all quote requests at once.")}</p>
      <Link href="/treg" className="btn-primary mt-5">{t("Hap tregun", "Open the marketplace")}</Link>
    </div>
  );
  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="grid content-start gap-6">
        {[...groups.entries()].map(([seller, list]) => (
          <section key={seller} className="card p-5">
            <h2 className="text-lg">{seller}</h2>
            <ul className="mt-3 divide-y divide-line">
              {list.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0"><Link href={i.demo ? `/treg/demo/${encodeURIComponent(i.id.replace("demo:", ""))}` : `/treg/${i.id}`} className="font-medium hover:underline">{i.title}</Link>{i.demo && <span className="ml-2 rounded-full bg-bg-2 px-2 py-0.5 text-[11px] text-ink-2">{t("Demo", "Demo")}</span>}<p className="text-xs text-ink-2">{i.city} · {formatNumber(i.priceLek, 0)} L / {i.unit}</p>{result?.status === "done" && result.failed.includes(i.id) && <p className="text-xs text-[#8a5a00]">{t("Kjo kërkesë nuk u pranua (sasia ose marrja nuk përputhet).", "This request was not accepted (quantity or fulfilment doesn't match).")}</p>}</div>
                  <div className="flex items-center gap-3">
                    <label className="sr-only" htmlFor={`q-${i.id}`}>{t("Sasia", "Quantity")}</label>
                    <input id={`q-${i.id}`} type="number" min={1} max={i.max} value={i.quantity} onChange={(e) => cart.set(i.id, Number(e.target.value) || 1)} className="w-20 rounded-lg border border-line bg-bg px-2 py-1.5 text-right tabular-nums" />
                    <span className="text-sm text-ink-2">{i.unit}</span>
                    <span className="w-24 text-right font-semibold tabular-nums">{formatNumber(i.priceLek * i.quantity, 0)} L</span>
                    <button type="button" onClick={() => cart.remove(i.id)} className="text-sm text-ink-2 underline">{t("Hiq", "Remove")}</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <aside className="card grid content-start gap-4 p-6 lg:sticky lg:top-28">
        <p className="flex justify-between"><span className="text-ink-2">{t("Vlera e vlerësuar", "Estimated value")}</span><span className="text-xl font-semibold tabular-nums">{formatNumber(total, 0)} L</span></p>
        <fieldset className="grid gap-2 text-sm"><legend className="mb-1 text-xs font-semibold text-ink-2">{t("Marrja", "Fulfilment")}</legend>
          {(["pickup", "delivery"] as const).map((f) => <label key={f} className="flex items-center gap-2"><input type="radio" name="fulfillment" checked={fulfillment === f} onChange={() => setFulfillment(f)} className="accent-[var(--color-lime)]" />{f === "pickup" ? t("Marrje në vend", "Pickup") : t("Dorëzim", "Delivery")}</label>)}
        </fieldset>
        <label className="grid gap-1 text-sm"><span className="text-xs font-semibold text-ink-2">{t("Mesazh për shitësit", "Message to sellers")}</span><textarea required minLength={10} maxLength={1000} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("P.sh. afati, adresa e kantierit, nëse ju duhet faturë…", "E.g. timing, site address, whether you need an invoice…")} className="rounded-lg border border-line bg-bg px-3 py-2" /></label>
        {demoCount > 0 && <p className="rounded-xl bg-bg-2 px-3 py-2 text-xs text-ink-2">{t(`${demoCount} artikuj janë shembuj demo: shfaqin si funksionon shporta, por nuk u dërgohen shitësve.`, `${demoCount} item${demoCount === 1 ? " is a demo example" : "s are demo examples"}: they show how the cart works but are not sent to sellers.`)}</p>}
        <button disabled={pending || real.length === 0} className="btn-primary h-12 disabled:opacity-50">{pending ? t("Duke dërguar…", "Sending…") : t(`Dërgo ${real.length} kërkesa për ofertë`, `Send ${real.length} quote request${real.length === 1 ? "" : "s"}`)}</button>
        {result?.status === "login" && <p role="alert" className="text-sm">{t("Hyr në llogari për të dërguar kërkesat.", "Log in to send your requests.")} <Link href="/hyr" className="font-medium underline">{t("Hyr", "Log in")}</Link></p>}
        {result?.status === "invalid" && <p role="alert" className="text-sm">{t("Kontrollo sasitë dhe shkruaj një mesazh me të paktën 10 shkronja.", "Check quantities and write a message of at least 10 characters.")}</p>}
        <p className="text-xs text-ink-2">{t("Pagesa online nuk është aktive ende. Çdo shitës konfirmon çmimin, sasinë dhe marrjen përpara se të paguash.", "Online payment is not active yet. Each seller confirms price, quantity and fulfilment before you pay.")}</p>
      </aside>
    </form>
  );
}
