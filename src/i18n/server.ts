import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { setFormatLocale } from "@/lib/format";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { loadMessages } from "./load";
import { createTranslator } from "./translate";

/** The visitor's interface language (cookie), once per request. */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/** Translator for server components, route handlers and server actions. */
export const getT = cache(async () => {
  const locale = await getLocale();
  setFormatLocale(locale);
  return createTranslator(locale, await loadMessages(locale));
});
