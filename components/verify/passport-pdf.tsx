"use client";

import { useLang } from "@/components/lang-provider";

type Data = { code: string; title: string; category: string; quantity: string; region: string; seller: string; manufacturer: string | null; batch: string | null; origin: string | null; reviewed: string; inspection: string | null; documents: string[]; url: string };

/** Downloadable material passport summary (PDF with QR), generated in the browser from the public record. */
export function PassportPdf({ data }: { data: Data }) {
  const { t } = useLang();
  async function download() {
    const [{ PDFDocument, StandardFonts, rgb }, QR] = await Promise.all([import("pdf-lib"), import("qrcode")]);
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.05, 0.18, 0.17), muted = rgb(0.31, 0.42, 0.39);
    const safe = (s: string) => s.replace(/[^\u0000-ÿ]/g, (c) => ({ "×": "x", "²": "2", "·": "-" } as Record<string, string>)[c] ?? "");
    let y = 780;
    const line = (label: string, value: string | null) => { if (!value) return; page.drawText(safe(label), { x: 48, y, size: 9, font, color: muted }); page.drawText(safe(value).slice(0, 80), { x: 200, y, size: 11, font, color: ink }); y -= 22; };
    page.drawText("ECONERA", { x: 48, y, size: 20, font: bold, color: ink }); y -= 22;
    page.drawText("DIGITAL MATERIAL PASSPORT · PASAPORTA E MATERIALIT", { x: 48, y, size: 9, font, color: muted }); y -= 40;
    page.drawText(safe(data.title).slice(0, 60), { x: 48, y, size: 18, font: bold, color: ink }); y -= 34;
    line("Material ID", data.code); line("Category", data.category); line("Quantity", data.quantity); line("Region", data.region); line("Seller", data.seller);
    line("Manufacturer", data.manufacturer); line("Batch / lot", data.batch); line("Origin", data.origin); line("Last review", data.reviewed); line("Inspection", data.inspection ?? "Not performed");
    line("Documents reviewed", data.documents.join(", ") || "None");
    const png = await QR.toDataURL(data.url, { margin: 1, width: 300 });
    const img = await doc.embedPng(png);
    page.drawImage(img, { x: 420, y: 640, width: 130, height: 130 });
    page.drawText(safe(data.url), { x: 48, y: 120, size: 9, font, color: muted });
    page.drawText("ECONERA internal material passport - not an official regulatory Digital Product Passport or conformity certificate.", { x: 48, y: 96, size: 8, font, color: muted });
    page.drawText("Verification shows what was checked and when; it is not a blanket safety guarantee.", { x: 48, y: 84, size: 8, font, color: muted });
    const bytes = await doc.save();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
    a.download = `${data.code}.pdf`; a.click(); URL.revokeObjectURL(a.href);
  }
  return <button type="button" onClick={download} className="btn-ghost w-fit">{t("Shkarko pasaportën (PDF)", "Download passport (PDF)")}</button>;
}
