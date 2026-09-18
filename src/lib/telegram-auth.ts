import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

/** Login data older than this is refused (Telegram recommends checking auth_date). */
const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Checks data from the Telegram Login Widget: the hash is an HMAC-SHA256 of the sorted
 * "key=value" lines, keyed with SHA-256 of the bot token (core.telegram.org/widgets/login).
 */
export function verifyTelegramLogin(input: Record<string, unknown>, botToken: string, now = Date.now()): TelegramUser | null {
  const hash = typeof input.hash === "string" ? input.hash : "";
  if (!/^[a-f0-9]{64}$/.test(hash)) return null;

  const fields = Object.entries(input)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${String(value)}`)
    .sort();
  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(fields.join("\n")).digest("hex");
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(hash, "hex"))) return null;

  const authDate = Number(input.auth_date);
  const id = Number(input.id);
  if (!Number.isFinite(authDate) || !Number.isSafeInteger(id) || now / 1000 - authDate > MAX_AGE_SECONDS) return null;

  return {
    id,
    auth_date: authDate,
    hash,
    first_name: typeof input.first_name === "string" ? input.first_name.slice(0, 64) : undefined,
    last_name: typeof input.last_name === "string" ? input.last_name.slice(0, 64) : undefined,
    username: typeof input.username === "string" ? input.username.slice(0, 64) : undefined,
    photo_url: typeof input.photo_url === "string" && input.photo_url.startsWith("https://") ? input.photo_url : undefined,
  };
}

/**
 * Telegram accounts have no email: each one gets stable placeholder addresses, tried in
 * order. The reserved `.invalid` domain can never receive mail; if Supabase refuses it, the
 * site's own domain is used instead. Nothing is ever sent to either.
 */
export const telegramEmails = (id: number) => [`tg${id}@telegram.uniroute.invalid`, `tg${id}@telegram.uniroute-cyan.vercel.app`];
