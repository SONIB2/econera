import Link from "next/link";
import { createMaterial, editMaterial } from "@/app/(legacy)/inventari/actions";
import { Field } from "@/components/ui";
import { conditions, currencies, fulfillment, regions, units, type InventoryEntry } from "@/lib/data";
import { MaterialClassification } from "@/components/material-classification";

export function MaterialForm({ item }: { item?: InventoryEntry }) {
  return <form action={item ? editMaterial : createMaterial} className="panel form-grid">
    {item && <><input type="hidden" name="id" value={item.id} /><input type="hidden" name="revision" value={item.revision} /></>}
    <div className="span"><Field label="Titulli"><input name="title" defaultValue={item?.title} required minLength={4} maxLength={100} /></Field></div>
    <div className="span"><Field label="Përshkrimi"><textarea name="description" defaultValue={item?.description} required minLength={12} maxLength={2000} aria-describedby="material-hint" /></Field>
      <p className="muted" id="material-hint">Përshkruaj përmasat, gjendjen dhe kufizimet e njohura. Përshkrimi bëhet publik pas miratimit.</p>
    </div>
    <MaterialClassification initialCategory={item?.category} initialType={item?.masonry_type} />
    <Field label="Emri publik i shitësit (opsional)"><input name="seller_label" defaultValue={item?.seller_label ?? ""} minLength={2} maxLength={80} /></Field>
    <Field label="Qarku"><select name="region" defaultValue={item?.region ?? ""} required><option value="" disabled>Zgjidh qarkun</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></Field>
    <Field label="Gjendja"><select name="condition" defaultValue={item?.condition ?? ""} required><option value="" disabled>Zgjidh gjendjen</option>{Object.entries(conditions).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
    <Field label="Marrja e materialit"><select name="fulfillment" defaultValue={item?.fulfillment ?? ""} required><option value="" disabled>Zgjidh mënyrën</option>{Object.entries(fulfillment).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
    <Field label="Sasia"><input name="quantity" inputMode="decimal" required pattern="[0-9]{1,8}([.,][0-9]{1,3})?" defaultValue={item?.quantity} /></Field>
    <Field label="Njësia"><select name="unit" defaultValue={item?.unit ?? ""} required><option value="" disabled>Zgjidh njësinë</option>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></Field>
    <Field label="Çmimi për njësi"><input name="unit_price" inputMode="decimal" required pattern="[0-9]{1,8}([.,][0-9]{1,2})?" defaultValue={item?.unit_price} /></Field>
    <Field label="Monedha"><select name="currency" defaultValue={item?.currency ?? "ALL"}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></Field>
    {item && <p className="span muted">Ndryshimet e kthejnë materialin në skicë për shqyrtim të ri.</p>}
    <div className="actions span"><button className="button">{item ? "Ruaj ndryshimet" : "Ruaj skicën"}</button><Link href="/inventari">Anulo</Link></div>
  </form>;
}
