import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(new URL("/login?error=callback", requestUrl.origin));
    }
  }

  const response = NextResponse.redirect(new URL("/", requestUrl.origin), {
    status: 303,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
