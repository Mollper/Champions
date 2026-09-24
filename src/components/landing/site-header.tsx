import { getT } from "@/i18n/server";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageMenu } from "@/components/settings/language-switcher";
import { ThemePopover } from "@/components/settings/theme-popover";
import { ButtonLink } from "@/components/ui/button";
import type { Theme } from "@/lib/theme";

export async function SiteHeader({ isSignedIn, theme }: { isSignedIn: boolean; theme: Theme }) {
  const t = await getT();
  return (
    <header className="glass-bar sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-medium text-ink-soft md:flex" aria-label={t("Разделы")}>
          <a href="#result" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            {t("Что получите")}
          </a>
          <a href="#how" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            {t("Как это работает")}
          </a>
          <a href="#universities" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            {t("Вузы")}
          </a>
          <a href="/games" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            {t("Игры")}
          </a>
          <a href="#assistant" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            {t("AI-помощник")}
          </a>
        </nav>
        <div className="flex items-center gap-1.5">
          <LanguageMenu />
          <ThemePopover initial={theme} />
          {isSignedIn ? (
            <ButtonLink href="/dashboard" size="sm">
              {t("Мой маршрут")} <ArrowRight />
            </ButtonLink>
          ) : (
            <div className="flex items-center gap-1.5">
              <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                {t("Войти")}
              </ButtonLink>
              <ButtonLink href="/login?mode=signup" size="sm">
                {t("Начать")} <ArrowRight />
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
