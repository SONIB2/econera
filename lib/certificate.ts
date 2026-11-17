import { co2Factors } from "./demo";

export type CertificateInput = { category: string; label: string; quantity: number; unit: string };

/** Avoided emissions assume the reused item replaces the same mass of new material (cradle-to-gate factor). */
export function certificateFigures({ category, quantity, unit }: CertificateInput) {
  const factor = co2Factors[category];
  const kgPerUnit = factor?.kgPerUnit[unit] ?? 0;
  const massKg = quantity * kgPerUnit;
  return { massKg, co2Kg: massKg * (factor?.kgCO2PerKg ?? 0), factor: factor?.kgCO2PerKg ?? 0, kgPerUnit };
}

export function certificateNumber(input: CertificateInput) {
  let h = 2166136261;
  for (const ch of `${input.category}|${input.label}|${input.quantity}|${input.unit}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `ECN-2026-${String((h >>> 0) % 10000).padStart(4, "0")}`;
}

export { formatNumber as fmt } from "./format";
