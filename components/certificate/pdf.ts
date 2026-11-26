import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { fmt } from "@/lib/certificate";

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

export type CertificateData = { number: string; label: string; quantity: number; unit: string; co2Kg: number; massKg: number; factor: number; kgPerUnit: number; date: string; source: string };

/** A4 green certificate. Fonts are embedded from /public/fonts (Inter, SIL OFL) so Albanian letters render correctly. */
export async function certificatePdf(d: CertificateData, lang: "sq" | "en" = "sq") {
  const t = (sq: string, en: string) => (lang === "en" ? en : sq);
  const [regularBytes, boldBytes] = await Promise.all(["/fonts/Inter-Regular.ttf", "/fonts/Inter-Bold.ttf"].map((u) => fetch(u).then((r) => r.arrayBuffer())));
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${t("Certifikatë e gjelbër", "Green certificate")} ${d.number}`);
  doc.setAuthor("ECONERA");
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const bg = hex("#0b110e"), lime = hex("#c8f169"), ink = hex("#eef3ee"), muted = hex("#9fb0a6"), line = hex("#2a3b32"), card = hex("#15241d");

  page.drawRectangle({ x: 0, y: 0, width, height, color: bg });
  for (let x = 0; x < width; x += 32) page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: line, thickness: 0.3, opacity: 0.5 });
  for (let y = 0; y < height; y += 32) page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: line, thickness: 0.3, opacity: 0.5 });

  const m = 56;
  page.drawText("ECONERA", { x: m, y: height - 80, size: 18, font: bold, color: ink });
  page.drawText(d.number, { x: width - m - bold.widthOfTextAtSize(d.number, 11), y: height - 78, size: 11, font: bold, color: lime });
  page.drawText(t("CERTIFIKATË E GJELBËR", "GREEN CERTIFICATE"), { x: m, y: height - 160, size: 11, font: bold, color: lime });
  page.drawText(t("Materiale të ripërdorura,", "Reused materials,"), { x: m, y: height - 205, size: 32, font: bold, color: ink });
  page.drawText(t("ndikim i matshëm.", "measurable impact."), { x: m, y: height - 243, size: 32, font: bold, color: ink });
  page.drawText(`${fmt(d.quantity)} ${d.unit} · ${d.label}`, { x: m, y: height - 285, size: 13, font: regular, color: muted });

  const boxY = height - 470, boxW = (width - m * 2 - 16) / 2;
  const stat = (x: number, value: string, label: string) => {
    page.drawRectangle({ x, y: boxY, width: boxW, height: 140, color: card, borderColor: line, borderWidth: 1 });
    page.drawText(value, { x: x + 22, y: boxY + 72, size: 34, font: bold, color: lime });
    page.drawText(label, { x: x + 22, y: boxY + 36, size: 11, font: regular, color: ink });
  };
  stat(m, `−${fmt(d.co2Kg / 1000, 2)} t`, t("CO₂e e shmangur (vlerësim)", "CO₂e avoided (estimate)"));
  stat(m + boxW + 16, `${fmt(d.massKg / 1000, 2)} t`, t("mbetje të shmangura nga landfill-i", "waste kept out of landfill"));

  const rows: [string, string][] = [
    [t("Data", "Date"), d.date],
    [t("Masa e vlerësuar", "Estimated mass"), `${fmt(d.kgPerUnit, 2)} kg ${t("për", "per")} ${d.unit}`],
    [t("Faktori i emetimeve", "Emission factor"), `${fmt(d.factor, 3)} kg CO₂e/kg`],
    [t("Metoda", "Method"), t("Ripërdorimi zëvendëson të njëjtën masë materiali të ri", "Reuse replaces the same mass of new material")],
  ];
  let y = boxY - 50;
  for (const [k, v] of rows) {
    page.drawText(k, { x: m, y, size: 10, font: regular, color: muted });
    page.drawText(v, { x: m + 150, y, size: 10, font: regular, color: ink });
    page.drawLine({ start: { x: m, y: y - 10 }, end: { x: width - m, y: y - 10 }, color: line, thickness: 0.6 });
    y -= 30;
  }

  const note = [t("Shembull demonstrues. Shifrat janë vlerësime dhe jo matje e certifikuar.", "Demonstration example. Figures are estimates, not a certified measurement."), t("Burimi i faktorëve: ", "Source of factors: ") + d.source.split(".")[0] + "."];
  note.forEach((t, i) => page.drawText(t, { x: m, y: 92 - i * 14, size: 8.5, font: regular, color: muted }));
  page.drawText(t("econera.al · AI propozon, njeriu konfirmon.", "econera.al · AI suggests, people confirm."), { x: m, y: 52, size: 9, font: bold, color: lime });

  return doc.save();
}
