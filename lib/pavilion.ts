export const finishes = [
  { id: "tulle", label: "Tullë", href: "/materiale/murature" },
  { id: "dru", label: "Dru", href: "/materiale?category=dru" },
  { id: "beton", label: "Beton", href: "/materiale?category=beton" },
] as const;

export const lighting = [
  { id: "agim", label: "Agim" },
  { id: "muzg", label: "Muzg" },
] as const;

export const roofProfiles = [
  { id: "rrafshet", label: "E rrafshët" },
  { id: "dy-pjerresi", label: "Dy pjerrësi" },
] as const;

export const defaultPavilionAngle = -32;

export function pavilionView(angle: number) {
  return ((Math.round(angle) % 360 + 540) % 360) - 180;
}

export function readPavilion(params: Record<string, string | string[] | undefined>) {
  const angle = typeof params.kendi === "string" && /^-?\d{1,3}$/.test(params.kendi) ? Number(params.kendi) : defaultPavilionAngle;
  return {
    finish: finishes.find(({ id }) => id === params.material) ?? finishes[0],
    light: lighting.find(({ id }) => id === params.drita) ?? lighting[0],
    roof: roofProfiles.find(({ id }) => id === params.catia) ?? roofProfiles[0],
    angle: pavilionView(angle),
  };
}
