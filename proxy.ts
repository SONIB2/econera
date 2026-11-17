import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applicationOrigin, supabaseSettings } from "@/lib/deployment";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const headers = new Headers(request.headers);
    headers.set("x-econera-locale", request.nextUrl.searchParams.get("lang") === "en" ? "en" : "sq");
    return NextResponse.next({ request: { headers } });
  }
  if (request.nextUrl.pathname.startsWith("/en/") || request.nextUrl.pathname.startsWith("/sq/")) {
    const headers = new Headers(request.headers);
    headers.set("x-econera-locale", request.nextUrl.pathname.startsWith("/en/") ? "en" : "sq");
    return NextResponse.next({ request: { headers } });
  }
  let response = NextResponse.next({ request });
  const settings = supabaseSettings();
  if (!settings) return response;
  const db = createServerClient(settings.url, settings.key, {
    cookieOptions: { httpOnly: true, secure: applicationOrigin()?.startsWith("https://") ?? false, sameSite: "lax" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (updates) => {
        updates.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await db.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/", "/en/platform", "/sq/platform", "/paneli/:path*", "/inventari/:path*", "/administrim/:path*", "/disponueshmeria", "/materiale/:id/oferte", "/fjalekalimi/:path*", "/hyr", "/regjistrohu"] };
