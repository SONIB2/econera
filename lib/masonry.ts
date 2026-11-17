export const masonryTypes = [
  { id: "clay", name: "Tullë argjile e plotë", tag: "ARGJILË · E PLOTË", description: "Tullë pa zgavra, me sipërfaqe të dallueshme argjile. Përdoret në muraturë të dukshme dhe në punime restaurimi, sipas specifikimit të projektit.", checks: ["Përmasat dhe tolerancat", "Thithja e ujit", "Rezistenca e deklaruar në shtypje"] },
  { id: "hollow", name: "Tullë me zgavra", tag: "ARGJILË · ME ZGAVRA", description: "Element argjile me kanale të brendshme. Forma dhe drejtimi i zgavrave varen nga familja e produktit.", checks: ["Drejtimi i zgavrave", "Përmasat e modulit", "Dokumentacioni termik dhe strukturor"] },
  { id: "reclaimed", name: "Tullë e rikuperuar", tag: "ARGJILË · RIPËRDORIM", description: "Tulla të rikuperuara me ndryshime në ngjyrë, përmasa dhe gjendje. Shqyrto mostrën dhe prejardhjen e çdo loti.", checks: ["Prejardhja e lotit", "Çarje dhe mbetje llaçi", "Përputhshmëria me përdorimin e synuar"] },
  { id: "block", name: "Bllok murature betoni", tag: "BETON · MURATURË", description: "Bllok betoni për sisteme murature. Përbërja, masa dhe gjeometria ndryshojnë sipas prodhuesit dhe modelit.", checks: ["Përmasat e modulit", "Pesha dhe forma e bllokut", "Dokumentacioni i përdorimit strukturor"] },
] as const;

export type MasonryType = typeof masonryTypes[number]["id"];
export function findMasonryType(value: unknown) {
  return masonryTypes.find(({ id }) => id === value);
}
