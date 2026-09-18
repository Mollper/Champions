import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { telegramEmails, verifyTelegramLogin } from "@/lib/telegram-auth";

/**
 * POST /auth/telegram — data from the Telegram Login Widget → a Supabase session.
 * Supabase has no Telegram provider, so after checking the signature the server finds
 * or creates the account (placeholder email) and signs in with a one-time link token.
 */
export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const admin = createAdminClient();
  if (!botToken || !admin) return NextResponse.json({ error: "Вход через Telegram не настроен." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const tg = body && typeof body === "object" ? verifyTelegramLogin(body as Record<string, unknown>, botToken) : null;
  if (!tg) return NextResponse.json({ error: "Telegram не подтвердил вход. Попробуй ещё раз." }, { status: 401 });

  const fullName = [tg.first_name, tg.last_name].filter(Boolean).join(" ") || tg.username || "Telegram";
  let email: string | null = null;
  for (const candidate of telegramEmails(tg.id)) {
    const created = await admin.auth.admin.createUser({
      email: candidate,
      email_confirm: true,
      user_metadata: { full_name: fullName, telegram_id: tg.id, telegram_username: tg.username ?? null, avatar_url: tg.photo_url ?? null },
    });
    // "already registered" is the normal case for returning users
    if (!created.error || /already|exists|registered/i.test(created.error.message)) {
      email = candidate;
      break;
    }
    console.error("[telegram] create user failed", candidate, created.error.message);
  }
  if (!email) return NextResponse.json({ error: "Не удалось создать аккаунт." }, { status: 500 });

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) return NextResponse.json({ error: "Не удалось войти. Попробуй ещё раз." }, { status: 500 });

  // exchanging the token with the cookie-bound client sets the session on this response
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error || !data.user) return NextResponse.json({ error: "Не удалось войти. Попробуй ещё раз." }, { status: 500 });

  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase.from("users").select("role").eq("id", data.user.id).maybeSingle(),
    supabase.from("profiles").select("completed_at").eq("user_id", data.user.id).maybeSingle(),
  ]);
  const redirect = account?.role === "admin" ? "/admin" : account?.role === "mentor" ? "/mentor" : profile?.completed_at ? "/dashboard" : "/profile";
  return NextResponse.json({ redirect });
}
