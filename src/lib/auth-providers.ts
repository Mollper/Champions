import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

export type AuthProviders = { google: boolean; telegramBotId: string | null };

/**
 * Which sign-in buttons to show: Google once the provider is enabled in Supabase
 * (public /auth/v1/settings), Telegram once the bot is configured in env.
 */
export async function getAuthProviders(): Promise<AuthProviders> {
  let google = false;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabasePublishableKey }, next: { revalidate: 300 } });
    if (res.ok) google = Boolean(((await res.json()) as { external?: Record<string, boolean> }).external?.google);
  } catch {
    // settings are optional: no Google button then
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const telegramBotId = token && /^\d+:/.test(token) ? token.split(":")[0] : null;
  return { google, telegramBotId };
}
