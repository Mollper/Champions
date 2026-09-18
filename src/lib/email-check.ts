import "server-only";
import { resolve4, resolve6, resolveMx } from "node:dns/promises";

/** Throwaway inboxes: they exist for ten minutes, which defeats confirming the address at all. */
const DISPOSABLE = new Set([
  "10minutemail.com",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  "burnermail.io",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamailblock.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "minuteinbox.com",
  "mohmal.com",
  "sharklasers.com",
  "tempail.com",
  "temp-mail.io",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "tempmailo.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
  "yopmail.net",
]);

/** Misspellings of popular providers. Several are real, typo-squatting domains that do accept mail. */
const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.ru": "gmail.com",
  "gmail.kz": "gmail.com",
  "mail.ry": "mail.ru",
  "mai.ru": "mail.ru",
  "mial.ru": "mail.ru",
  "yandex.ry": "yandex.ru",
  "yandx.ru": "yandex.ru",
  "yanex.ru": "yandex.ru",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "iclod.com": "icloud.com",
  "icloud.co": "icloud.com",
};

/** "aliya@gmial.com" → "aliya@gmail.com"; null when the domain doesn't look like a typo. */
export function suggestEmail(email: string): string | null {
  const [local, domain] = email.toLowerCase().split("@");
  const fixed = domain ? TYPOS[domain] : undefined;
  return fixed ? `${local}@${fixed}` : null;
}

export type EmailDomainCheck = "ok" | "no-mail" | "disposable";

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);

const code = (error: unknown) => (error as { code?: string })?.code;
/** DNS answers that mean "this name has no such records", as opposed to "DNS is unreachable". */
const MISSING = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

/**
 * Can this address receive mail at all? A domain with no mail server (and no host to fall
 * back to, RFC 5321 §5.1) is a typo or made up — the code letter could never arrive.
 * DNS trouble on our side never blocks a sign-up: the confirmation code still guards it.
 */
export async function checkEmailDomain(email: string): Promise<EmailDomainCheck> {
  const domain = email.split("@")[1]?.toLowerCase().replace(/\.$/, "");
  if (!domain) return "no-mail";
  if (DISPOSABLE.has(domain)) return "disposable";

  try {
    const mx = await withTimeout(resolveMx(domain), 3000);
    // RFC 7505 "null MX": the domain explicitly accepts no mail
    if (mx.length === 1 && mx[0].exchange === "") return "no-mail";
    return mx.length ? "ok" : "no-mail";
  } catch (error) {
    if (!MISSING.has(code(error) ?? "")) return "ok";
    if (code(error) === "ENOTFOUND") return "no-mail";
  }

  // no MX record: mail falls back to the domain's own address, if it has one
  const hosts = await Promise.allSettled([withTimeout(resolve4(domain), 2000), withTimeout(resolve6(domain), 2000)]);
  if (hosts.some((h) => h.status === "fulfilled" && h.value.length > 0)) return "ok";
  return hosts.every((h) => h.status === "rejected" && MISSING.has(code(h.reason) ?? "")) ? "no-mail" : "ok";
}
