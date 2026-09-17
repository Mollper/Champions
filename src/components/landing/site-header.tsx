import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export function SiteHeader({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-medium text-ink-soft md:flex" aria-label="Разделы">
          <a href="#result" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            Что получите
          </a>
          <a href="#how" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            Как это работает
          </a>
          <a href="#universities" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            Вузы
          </a>
          <a href="#assistant" className="rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
            AI-помощник
          </a>
        </nav>
        {isSignedIn ? (
          <ButtonLink href="/dashboard" size="sm">
            Мой маршрут <ArrowRight />
          </ButtonLink>
        ) : (
          <div className="flex items-center gap-1.5">
            <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Войти
            </ButtonLink>
            <ButtonLink href="/login?mode=signup" size="sm">
              Начать <ArrowRight />
            </ButtonLink>
          </div>
        )}
      </div>
    </header>
  );
}
