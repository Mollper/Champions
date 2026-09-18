import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { homeAfterSignIn } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the button in the confirmation letter.
 * `?token_hash=&type=` (our template) works on any device — the phone's mail app included;
 * `?code=` (Supabase's default template) only in the browser that signed up.
 * Without an explicit `next`, the person lands where their role starts.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { data: { user: null }, error: new Error("missing token") };

  if (error || !data.user) return NextResponse.redirect(new URL("/login?error=link", origin));
  return NextResponse.redirect(new URL(await homeAfterSignIn(supabase, data.user, next), origin));
}
