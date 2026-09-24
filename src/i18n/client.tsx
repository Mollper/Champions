"use client";

import { createContext, use, useContext, useMemo } from "react";
import { setFormatLocale } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { loadMessages } from "./load";
import { createTranslator, type Translate } from "./translate";

const I18nContext = createContext<{ locale: Locale; t: Translate }>({ locale: DEFAULT_LOCALE, t: createTranslator(DEFAULT_LOCALE, {}) });

/**
 * Supplies the current language and its dictionary to client components. The dictionary
 * comes as a cached chunk; hydration waits for it while the server-rendered page stays visible.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const messages = use(loadMessages(locale));
  const value = useMemo(() => ({ locale, t: createTranslator(locale, messages) }), [locale, messages]);
  // formatters (dates, money) read the language without a hook
  setFormatLocale(locale);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext).t;
export const useLocale = () => useContext(I18nContext).locale;
