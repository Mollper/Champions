import { getT } from "@/i18n/server";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LanguageMenu } from "@/components/settings/language-switcher";
import { ThemePopover } from "@/components/settings/theme-popover";
import { getCurrentUserId } from "@/lib/auth";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

/** Mini-games are public: anyone can play from the landing page, signed in or not. */
export default async function GamesLayout({ children }: LayoutProps<"/games">) {
  const t = await getT();
  const [userId, jar] = await Promise.all([getCurrentUserId(), cookies()]);
  return (
    <>
      <header className="glass-bar sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-1.5">
            <LanguageMenu />
            <ThemePopover initial={parseTheme(jar.get(THEME_COOKIE)?.value)} />
            <Link
              href={userId ? "/dashboard" : "/"}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:bg-brand-50 hover:text-brand-700"
            >
              <ArrowLeft className="size-4" aria-hidden /> {t(userId ? "В приложение" : "На главную")}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
// UniRoute · src/app/games/layout.tsx
