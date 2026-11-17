import { NextResponse, type NextRequest } from "next/server";
import { applicationOrigin, sessionDatabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = applicationOrigin() ?? request.nextUrl.origin;
  const destination = request.nextUrl.searchParams.get("flow") === "recovery" ? "/fjalekalimi/ndrysho" : "/paneli";
  function finish(path: string) {
    const response = NextResponse.redirect(new URL(path, origin));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  const settings = await sessionDatabase();
  if (code && settings) {
    const { error } = await settings.auth.exchangeCodeForSession(code);
    if (!error) return finish(destination);
  }
  return finish("/hyr?status=link");
}
