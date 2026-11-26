import "server-only";

/** Which AI services are configured. Keys stay on the server; the client only learns yes/no. */
export function aiStatus() {
  return {
    analysis: Boolean(process.env.ANTHROPIC_API_KEY),
    design: Boolean(process.env.OPENAI_API_KEY),
  };
}

const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

type Content = { type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

/** Calls the Claude Messages API and returns the text of the reply. */
export async function claude(system: string, content: Content[], maxTokens = 1200, model = MODEL(), timeoutMs = 45000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("not-configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`claude-${res.status}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

/** Pulls the first JSON object out of a model reply. */
export function firstJson<T>(text: string): T | null {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)) as T; } catch { return null; }
}

/** Image edit with OpenAI's image model, keeping the input photo's layout. Returns a PNG data URL. */
export async function editImage(photo: { mediaType: string; data: Buffer }, prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("not-configured");
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("image", new Blob([new Uint8Array(photo.data)], { type: photo.mediaType }), "room.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`image-${res.status}`);
  const data = (await res.json()) as { data: { b64_json?: string }[] };
  const b64 = data.data[0]?.b64_json;
  if (!b64) throw new Error("image-empty");
  return `data:image/png;base64,${b64}`;
}

/** Validates a data URL photo: jpeg/png/webp, at most 5 MB. */
export function parsePhoto(dataUrl: unknown) {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const data = Buffer.from(m[2], "base64");
  if (data.length > 5 * 1024 * 1024) return null;
  return { mediaType: m[1], base64: m[2], data };
}
