"use client";

import { useT } from "@/i18n/client";
import { Check, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { useState } from "react";
import { ACCENTS, BACKGROUNDS, DEFAULT_THEME, MODES, RADII, serializeTheme, STYLES, TEXT_SIZES, THEME_COOKIE, themeAttributes, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const MODE_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

/** Applies a theme to the page at once and remembers it for the server's next render. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [attr, value] of Object.entries(themeAttributes(theme))) root.setAttribute(attr, value);
  document.cookie = `${THEME_COOKIE}=${serializeTheme(theme)}; path=/; max-age=31536000; samesite=lax`;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useT();
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{t(title)}</p>
      {children}
    </div>
  );
}

function Pills<T extends string>({ value, options, onChange }: { value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-pill px-3.5 py-2 text-sm font-medium transition",
            value === o.id ? "bg-brand-600 text-white" : "bg-canvas text-ink-soft ring-1 ring-line hover:text-ink",
          )}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

export function ThemeControls({ initial, compact = false }: { initial: Theme; compact?: boolean }) {
  const t = useT();
  const [theme, setTheme] = useState(initial);
  const update = (patch: Partial<Theme>) => {
    const next = { ...theme, ...patch };
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      <Group title={t("Цвет акцента")}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={theme.accent === a.id}
              onClick={() => update({ accent: a.id })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl p-2 text-xs font-medium transition",
                theme.accent === a.id ? "bg-canvas ring-2 ring-brand-400" : "hover:bg-canvas",
              )}
            >
              <span
                className="grid size-9 place-items-center rounded-full shadow-inner ring-2 ring-white/60"
                style={{ background: `linear-gradient(135deg, ${a.swatch}, color-mix(in oklab, ${a.swatch} 55%, white))` }}
              >
                {theme.accent === a.id && <Check className="size-4 text-white" strokeWidth={3} aria-hidden />}
              </span>
              {t(a.label)}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("Тема")}>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const Icon = MODE_ICON[m.id];
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={theme.mode === m.id}
                onClick={() => update({ mode: m.id })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition",
                  theme.mode === m.id ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-soft hover:border-line-strong",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t(m.label)}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title={t("Стиль")}>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={theme.style === s.id}
              onClick={() => update({ style: s.id })}
              className={cn(
                "rounded-2xl border p-3 text-left transition",
                theme.style === s.id ? "border-brand-400 bg-brand-50" : "border-line hover:border-line-strong",
              )}
            >
              <span
                className={cn(
                  "mb-2 block h-14 overflow-hidden rounded-xl",
                  s.id === "glass" ? "bg-gradient-to-br from-brand-300 via-route-400/60 to-coral-400/60" : "bg-canvas",
                )}
                aria-hidden
              >
                <span
                  className={cn("m-2 block h-10 rounded-lg", s.id === "glass" ? "bg-white/40 ring-1 ring-white/60 backdrop-blur-md" : "bg-surface shadow-card")}
                />
              </span>
              <span className="block text-sm font-semibold">{t(s.label)}</span>
              {!compact && <span className="block text-xs text-muted">{t(s.hint)}</span>}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("Фон")}>
        <Pills value={theme.bg} options={BACKGROUNDS} onChange={(bg) => update({ bg })} />
      </Group>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Group title={t("Скругление")}>
          <Pills value={theme.radius} options={RADII} onChange={(radius) => update({ radius })} />
        </Group>
        <Group title={t("Размер текста")}>
          <Pills value={theme.text} options={TEXT_SIZES} onChange={(text) => update({ text })} />
        </Group>
      </div>

      <button
        type="button"
        onClick={() => update(DEFAULT_THEME)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <RotateCcw className="size-4" aria-hidden /> {t("Вернуть как было")}
      </button>
    </div>
  );
}
// UniRoute · src/components/settings/theme-controls.tsx
