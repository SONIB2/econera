import Link from "next/link";
import { createMaterial, editMaterial } from "@/app/(legacy)/inventari/actions";
import { Field } from "@/components/ui";
import { conditions, currencies, fulfillment, regions, sheetMaterials, units, type InventoryEntry } from "@/lib/data";
import { MaterialClassification } from "@/components/material-classification";

/** `draft` pre-fills a new listing (e.g. from the voice assistant); the seller still reviews and saves it. */
export function MaterialForm({ item, draft }: { item?: InventoryEntry; draft?: Partial<InventoryEntry> }) {
  const v: Partial<InventoryEntry> | undefined = item ?? draft;
  const sheet = v as (Partial<InventoryEntry> & Partial<Record<"sheet_material" | "color" | "length_mm" | "width_mm" | "thickness_mm", string | number | null>>) | undefined;
  return <form action={item ? editMaterial : createMaterial} className="panel form-grid">
    {item && <><input type="hidden" name="id" value={item.id} /><input type="hidden" name="revision" value={item.revision} /></>}
    <div className="span"><Field label="Titulli"><input name="title" defaultValue={v?.title} required minLength={4} maxLength={100} /></Field></div>
    <div className="span"><Field label="Përshkrimi"><textarea name="description" defaultValue={v?.description} required minLength={12} maxLength={2000} aria-describedby="material-hint" /></Field>
      <p className="muted" id="material-hint">Përshkruaj përmasat, gjendjen dhe kufizimet e njohura. Përshkrimi bëhet publik pas miratimit.</p>
    </div>
    <MaterialClassification initialCategory={v?.category} initialType={v?.masonry_type} />
    <Field label="Emri publik i shitësit (opsional)"><input name="seller_label" defaultValue={v?.seller_label ?? ""} minLength={2} maxLength={80} /></Field>
    <Field label="Qarku"><select name="region" defaultValue={v?.region ?? ""} required><option value="" disabled>Zgjidh qarkun</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></Field>
    <Field label="Gjendja"><select name="condition" defaultValue={v?.condition ?? ""} required><option value="" disabled>Zgjidh gjendjen</option>{Object.entries(conditions).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
    <Field label="Marrja e materialit"><select name="fulfillment" defaultValue={v?.fulfillment ?? ""} required><option value="" disabled>Zgjidh mënyrën</option>{Object.entries(fulfillment).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
    <Field label="Sasia"><input name="quantity" inputMode="decimal" required pattern="[0-9]{1,8}([.,][0-9]{1,3})?" defaultValue={v?.quantity} /></Field>
    <Field label="Njësia"><select name="unit" defaultValue={v?.unit ?? ""} required><option value="" disabled>Zgjidh njësinë</option>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></Field>
    <Field label="Çmimi për njësi"><input name="unit_price" inputMode="decimal" required pattern="[0-9]{1,8}([.,][0-9]{1,2})?" defaultValue={v?.unit_price} /></Field>
    <Field label="Monedha"><select name="currency" defaultValue={v?.currency ?? "ALL"}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></Field>
    <details className="span">
      <summary>Copëz ose fletë materiali (për SmartCut, opsionale)</summary>
      <p className="muted">Për copëza drejtkëndëshe: MDF, kompensatë, OSB, laminat, gur, xham, metal. Masat në milimetra.</p>
      <div className="form-grid">
        <Field label="Materiali i fletës"><select name="sheet_material" defaultValue={sheet?.sheet_material ?? ""}><option value="">Nuk është copëz</option>{sheetMaterials.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Ngjyra (opsionale)"><input name="color" maxLength={40} defaultValue={sheet?.color ?? ""} /></Field>
        <Field label="Gjatësia (mm)"><input name="length_mm" inputMode="numeric" pattern="[0-9]{1,5}" defaultValue={sheet?.length_mm ?? ""} /></Field>
        <Field label="Gjerësia (mm)"><input name="width_mm" inputMode="numeric" pattern="[0-9]{1,5}" defaultValue={sheet?.width_mm ?? ""} /></Field>
        <Field label="Trashësia (mm)"><input name="thickness_mm" inputMode="decimal" pattern="[0-9]{1,3}([.,][0-9])?" defaultValue={sheet?.thickness_mm ?? ""} /></Field>
      </div>
      <p className="muted">Defektet dhe zonat e dëmtuara përshkruaji te përshkrimi dhe në foto.</p>
    </details>
    {item && <p className="span muted">Ndryshimet e kthejnë materialin në skicë për shqyrtim të ri.</p>}
    <div className="actions span"><button className="button">{item ? "Ruaj ndryshimet" : "Ruaj skicën"}</button><Link href="/inventari">Anulo</Link></div>
  </form>;
}
