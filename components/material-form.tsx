import Link from "next/link";
import { createMaterial, editMaterial } from "@/app/(legacy)/inventari/actions";
import { Field } from "@/components/ui";
import { conditions, currencies, fulfillment, regions, sheetMaterials, units, type InventoryEntry } from "@/lib/data";
import { MaterialClassification } from "@/components/material-classification";

/** `draft` pre-fills a new listing (e.g. from the voice assistant); the seller still reviews and saves it. */
const useLabels: Record<string, string> = { decorative: "Dekorativ", non_structural: "Jo strukturor", finishing: "Përfundime / veshje", structural: "Strukturor / mbajtës", fire_safety: "Mbrojtje nga zjarri", electrical: "Elektrik me rëndësi sigurie", pressure: "Sistem me presion" };

export function MaterialForm({ item, draft }: { item?: InventoryEntry; draft?: Partial<InventoryEntry> }) {
  const v: Partial<InventoryEntry> | undefined = item ?? draft;
  const vx = v as (Partial<Record<"intended_use" | "manufacturer" | "model_ref" | "batch_no" | "origin_country" | "age_years" | "storage_conditions" | "known_defects" | "sourcing", string | number | null>>) | undefined;
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
    <fieldset className="span">
      <legend>Të dhënat për verifikim (ECONERA Verify)</legend>
      <p className="muted">Sa më të plota, aq më shpejt shqyrtohet listimi. Materialet strukturore, për zjarr, elektrike ose me presion kërkojnë dokumente teknike dhe mund të kërkojnë inspektim.</p>
      <div className="form-grid">
        <Field label="Përdorimi i synuar"><select name="intended_use" defaultValue={vx?.intended_use ?? "non_structural"}>{Object.entries(useLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Prodhuesi (nëse dihet)"><input name="manufacturer" maxLength={120} defaultValue={vx?.manufacturer ?? ""} /></Field>
        <Field label="Modeli / nr. reference"><input name="model_ref" maxLength={120} defaultValue={vx?.model_ref ?? ""} /></Field>
        <Field label="Loti / batch"><input name="batch_no" maxLength={80} defaultValue={vx?.batch_no ?? ""} /></Field>
        <Field label="Vendi i origjinës"><input name="origin_country" maxLength={60} defaultValue={vx?.origin_country ?? ""} /></Field>
        <Field label="Mosha (vite)"><input name="age_years" inputMode="decimal" pattern="[0-9]{1,3}([.,][0-9])?" defaultValue={vx?.age_years ?? ""} /></Field>
        <div className="span"><Field label="Kushtet e ruajtjes"><input name="storage_conditions" maxLength={300} defaultValue={vx?.storage_conditions ?? ""} placeholder="p.sh. magazinë e mbyllur, e thatë" /></Field></div>
        <div className="span"><Field label="Defekte të njohura"><textarea name="known_defects" maxLength={1000} defaultValue={vx?.known_defects ?? ""} /></Field></div>
        <div className="span"><Field label="Burimi / pronësia (nga vjen materiali)"><input name="sourcing" maxLength={500} defaultValue={vx?.sourcing ?? ""} placeholder="p.sh. tepricë nga kantieri X, faturë nr. ..." /></Field></div>
      </div>
      <p className="muted">Fotot dhe dokumentet ngarkohen te faqja „Dokumentet” pas ruajtjes.</p>
    </fieldset>
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
