import type { Locale } from "./config";
import type { Messages } from "./translate";

/**
 * Each dictionary is its own chunk: the browser downloads the one it needs once and caches it,
 * instead of every page carrying it inline.
 */
const LOADERS: Record<Exclude<Locale, "ru">, () => Promise<{ default: Messages }>> = {
  en: () => import("./messages/en.json"),
  kk: () => import("./messages/kk.json"),
};

// One promise per locale, reused for the lifetime of the tab — client components read this
// through React's use(), which requires the exact same promise object on every render.
const pending = new Map<Locale, Promise<Messages>>();
pending.set("ru", Promise.resolve({}));

export function loadMessages(locale: Locale): Promise<Messages> {
  let promise = pending.get(locale);
  if (!promise && locale !== "ru") {
    promise = LOADERS[locale]()
      .then((m) => m.default)
      .catch(() => ({}));
    pending.set(locale, promise);
  }
  return promise!;
}
// UniRoute · src/i18n/load.ts
