/**
 * Appearance settings. Stored in one cookie so the server renders the right
 * <html data-*> attributes and the page never flashes the default theme.
 */

export const ACCENTS = [
  { id: "indigo", label: "Фиолетовый", swatch: "#5a36f2" },
  { id: "ocean", label: "Океан", swatch: "#2f5fe0" },
  { id: "sky", label: "Небо", swatch: "#0f86c9" },
  { id: "mint", label: "Мята", swatch: "#0e9c8c" },
  { id: "forest", label: "Лес", swatch: "#1f9950" },
  { id: "sunset", label: "Закат", swatch: "#e0561f" },
  { id: "rose", label: "Роза", swatch: "#dc2c5f" },
  { id: "grape", label: "Виноград", swatch: "#b12fc7" },
  { id: "graphite", label: "Графит", swatch: "#4a5064" },
] as const;

export const MODES = [
  { id: "light", label: "Светлая" },
  { id: "dark", label: "Тёмная" },
  { id: "system", label: "Как в системе" },
] as const;

export const STYLES = [
  { id: "glass", label: "Стекло", hint: "Полупрозрачные панели с размытием, как в iOS 26" },
  { id: "classic", label: "Классика", hint: "Плотные белые карточки" },
] as const;

export const BACKGROUNDS = [
  { id: "aurora", label: "Аврора" },
  { id: "dots", label: "Точки" },
  { id: "plain", label: "Однотонный" },
] as const;

export const RADII = [
  { id: "soft", label: "Мягкие" },
  { id: "round", label: "Круглые" },
  { id: "sharp", label: "Строгие" },
] as const;

export const TEXT_SIZES = [
  { id: "normal", label: "Обычный" },
  { id: "large", label: "Крупный" },
] as const;

export type Theme = {
  accent: (typeof ACCENTS)[number]["id"];
  mode: (typeof MODES)[number]["id"];
  style: (typeof STYLES)[number]["id"];
  bg: (typeof BACKGROUNDS)[number]["id"];
  radius: (typeof RADII)[number]["id"];
  text: (typeof TEXT_SIZES)[number]["id"];
};

export const DEFAULT_THEME: Theme = { accent: "indigo", mode: "light", style: "glass", bg: "aurora", radius: "soft", text: "normal" };

export const THEME_COOKIE = "ur-theme";

const pick = <T extends { id: string }>(list: readonly T[], value: string | undefined, fallback: T["id"]): T["id"] => list.find((o) => o.id === value)?.id ?? fallback;

/** "ocean.dark.glass.aurora.soft.normal" → Theme (unknown parts fall back to defaults). */
export function parseTheme(value: string | undefined | null): Theme {
  const [accent, mode, style, bg, radius, text] = (value ?? "").split(".");
  return {
    accent: pick(ACCENTS, accent, DEFAULT_THEME.accent),
    mode: pick(MODES, mode, DEFAULT_THEME.mode),
    style: pick(STYLES, style, DEFAULT_THEME.style),
    bg: pick(BACKGROUNDS, bg, DEFAULT_THEME.bg),
    radius: pick(RADII, radius, DEFAULT_THEME.radius),
    text: pick(TEXT_SIZES, text, DEFAULT_THEME.text),
  };
}

export const serializeTheme = (t: Theme) => [t.accent, t.mode, t.style, t.bg, t.radius, t.text].join(".");

export const themeAttributes = (t: Theme) => ({
  "data-accent": t.accent,
  "data-mode": t.mode,
  "data-style": t.style,
  "data-bg": t.bg,
  "data-radius": t.radius,
  "data-text": t.text,
});
