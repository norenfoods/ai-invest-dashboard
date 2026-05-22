import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const getSafeNextPath = (next: string | null): string => {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  if (next.startsWith("/login")) {
    return "/";
  }

  return next;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", "callback");
      loginUrl.searchParams.set("next", next);

      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin), {
    status: 303,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
