import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { claude, firstJson, parsePhoto } from "@/lib/ai/providers";
import { clientIp, rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const input = z.object({ image: z.string().max(7_500_000), lang: z.enum(["sq", "en"]), roomType: z.string().max(40), style: z.string().max(40), consent: z.literal(true) });

export type RoomAnalysis = { room: string; observations: string[]; currentMaterials: string[]; condition: string; suggestions: string[]; caution: string };

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (rateLimited(`room:${ip}`, 6, 60 * 60 * 1000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const photo = parsePhoto(parsed.data.image);
  if (!photo) return NextResponse.json({ error: "photo" }, { status: 400 });
  const language = parsed.data.lang === "en" ? "English" : "Albanian";
  const system = `You help plan home renovations for ECONERA, an Albanian marketplace for surplus and reclaimed construction materials. Look at the photo and answer in ${language}. Be concrete and modest: describe only what is visible, never guess hidden structure, never give structural or safety approval. Reply with JSON only: {"room": string, "observations": string[] (max 5), "currentMaterials": string[] (max 6), "condition": string, "suggestions": string[] (max 5, materials and finishes for a ${parsed.data.style} style ${parsed.data.roomType}, prefer reclaimed or surplus where sensible), "caution": string (one sentence on what needs a professional check)}.`;
  try {
    const reply = await claude(system, [{ type: "image", source: { type: "base64", media_type: photo.mediaType, data: photo.base64 } }, { type: "text", text: "Analyse this room for a renovation." }]);
    const json = firstJson<RoomAnalysis>(reply);
    if (!json) return NextResponse.json({ error: "format" }, { status: 502 });
    return NextResponse.json(json, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
