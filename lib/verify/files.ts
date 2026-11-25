import "server-only";
import { randomUUID } from "node:crypto";

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
const SIGNATURES: [string, number[]][] = [
  ["application/pdf", [0x25, 0x50, 0x44, 0x46]],
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/png", [0x89, 0x50, 0x4e, 0x47]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]],
];

/** Detects the real file type from its first bytes; the browser-declared type is not trusted. */
export function sniff(bytes: Uint8Array): string | null {
  for (const [mime, sig] of SIGNATURES) if (sig.every((b, i) => bytes[i] === b)) {
    if (mime === "image/webp" && String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") continue;
    return mime;
  }
  return null;
}

/** Rejects PDFs that carry scripts or auto-actions. Not a malware scanner; see docs/VERIFY.md. */
export function unsafePdf(bytes: Uint8Array) {
  const text = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 4_000_000))).toString("latin1");
  return /\/JavaScript|\/JS\s|\/Launch|\/EmbeddedFile|\/OpenAction\s*<<[^>]*\/S\s*\/JavaScript/.test(text);
}

export function safeName(name: string) {
  return name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").slice(-120) || "dokument";
}

export function storagePath(owner: string, subject: string, name: string) {
  return `${owner}/${subject}/${randomUUID()}-${safeName(name)}`;
}

export type CheckedFile = { bytes: Uint8Array; mime: string; name: string; size: number };

export async function checkFile(file: File): Promise<CheckedFile | { error: "empty" | "size" | "type" | "unsafe" }> {
  if (!file || file.size === 0) return { error: "empty" };
  if (file.size > MAX_FILE_BYTES) return { error: "size" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) return { error: "type" };
  if (mime === "application/pdf" && unsafePdf(bytes)) return { error: "unsafe" };
  return { bytes, mime, name: file.name, size: file.size };
}
