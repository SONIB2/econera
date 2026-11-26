import { logError } from "@/lib/monitor";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { editImage, parsePhoto } from "@/lib/ai/providers";
import { aiBudgetExceeded, clientIp, rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const input = z.object({ image: z.string().max(7_500_000), prompt: z.string().min(20).max(2000), consent: z.literal(true) });

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  if (await aiBudgetExceeded("design")) return NextResponse.json({ error: "busy" }, { status: 503 });
  if (await rateLimited(`design:${ip}`, 4, 24 * 60 * 60 * 1000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const photo = parsePhoto(parsed.data.image);
  if (!photo) return NextResponse.json({ error: "photo" }, { status: 400 });
  try {
    const image = await editImage({ mediaType: photo.mediaType, data: photo.data }, parsed.data.prompt);
    return NextResponse.json({ image }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logError("ai.design.failed", error);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
