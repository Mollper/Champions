/**
 * Interface languages. Russian is the source language: its strings are the dictionary keys,
 * and English and Kazakh dictionaries live in ./messages.
 */
export const LOCALES = [
  { code: "ru", label: "Русский", short: "RU", english: "Russian", intl: "ru-RU" },
  { code: "en", label: "English", short: "EN", english: "English", intl: "en-GB" },
  { code: "kk", label: "Қазақша", short: "KZ", english: "Kazakh", intl: "kk-KZ" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "ur-lang";

export const isLocale = (value: unknown): value is Locale => LOCALES.some((l) => l.code === value);
export const localeInfo = (locale: Locale) => LOCALES.find((l) => l.code === locale)!;

/** The language name to put into model prompts ("answer in …"). */
export const promptLanguage = (locale: Locale) => ({ ru: "Russian", en: "English", kk: "Kazakh (Cyrillic script)" })[locale];
