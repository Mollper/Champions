// Shared HTTP helpers for the catalog pipeline (server-only).

export const USER_AGENT = "UniRouteCatalogBot/1.0 (+https://uniroute-cyan.vercel.app; educational project)";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

export async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 15_000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

export async function getJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const res = await fetchWithTimeout(url, { ...init, headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init.headers } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return (await res.json()) as T;
}

/** Only public http(s) hosts — URLs come from Wikidata and page links, never from users. */
export function isSafePublicUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const host = u.hostname;
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) return false; // raw IPs
    return true;
  } catch {
    return false;
  }
}

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export type Page = {
  url: string;
  title: string;
  text: string;
  links: { href: string; text: string }[];
  lang: string | null;
  englishUrl: string | null;
};

/** Fetch an HTML page and reduce it to readable text plus same-site links. */
export async function fetchPage(url: string, maxChars = 14_000): Promise<Page | null> {
  if (!isSafePublicUrl(url)) return null;
  try {
    const res = await fetchWithTimeout(url, {
      timeoutMs: 12_000,
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en;q=0.9" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.includes("html")) return null;
    const html = (await res.text()).slice(0, 1_500_000);
    const finalUrl = res.url || url;

    const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
    const lang = html.match(/<html[^>]*\slang=["']([a-zA-Z-]+)/i)?.[1]?.toLowerCase() ?? null;
    const alternate = html.match(/<link[^>]+hreflang=["']en(?:-[a-zA-Z]+)?["'][^>]*>/i)?.[0].match(/href=["']([^"']+)/i)?.[1];
    let englishUrl: string | null = null;
    try {
      englishUrl = alternate ? new URL(decode(alternate), finalUrl).toString() : null;
    } catch {
      englishUrl = null;
    }
    const links: Page["links"] = [];
    for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      try {
        const href = new URL(decode(m[1]), finalUrl).toString();
        links.push({ href, text: decode(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim().slice(0, 80) });
      } catch {
        // ignore malformed links
      }
    }

    const text = decode(
      html
        .replace(/<(script|style|noscript|svg|iframe|header|footer|nav|template)[\s\S]*?<\/\1>/gi, " ")
        // attribute payloads (JSON in data-*, srcset, styles) can contain ">" and leak into the text
        .replace(/\s(?:data-[\w-]+|style|srcset|sizes|class|id|aria-[\w-]+|on\w+|content|href|src|alt|title)=("[^"]*"|'[^']*')/gi, "")
        .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section)>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    )
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim()
      .slice(0, maxChars);

    return text.length > 200 ? { url: finalUrl, title, text, links, lang, englishUrl } : null;
  } catch {
    return null;
  }
}

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// UniRoute · src/lib/catalog/http.ts
