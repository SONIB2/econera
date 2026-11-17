"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { categories, type MaterialInput } from "@/lib/data";
import { masonryTypes } from "@/lib/masonry";

export function MaterialClassification({ initialCategory, initialType }: {
  initialCategory?: MaterialInput["category"];
  initialType?: MaterialInput["masonry_type"];
}) {
  const [category, setCategory] = useState<string>(initialCategory ?? "");

  return <>
    <Field label="Kategoria"><select name="category" value={category} onChange={(event) => setCategory(event.target.value)} required>
      <option value="" disabled>Zgjidh kategorinë</option>
      {categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
    </select></Field>
    {category === "guri" && <Field label="Tipi i muraturës"><select name="masonry_type" defaultValue={initialType ?? ""}>
      <option value="">Pa tip të caktuar</option>
      {masonryTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
    </select></Field>}
  </>;
}
