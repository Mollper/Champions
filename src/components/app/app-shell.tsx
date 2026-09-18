"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Lock, LogOut, Menu, MoreHorizontal, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/login/actions";
import { Logo } from "@/components/brand/logo";
import type { JourneyState } from "@/lib/data/journey";
import { cn } from "@/lib/utils";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { isActive, JOURNEY, mobileNavFor, navFor } from "./nav-config";
import { ROLE_LABEL, type Role } from "@/lib/role-labels";

type Props = {
  account: { email: string | null; full_name: string | null; role?: Role };
  journey: JourneyState;
  children: React.ReactNode;
};

export function AppShell({ account, journey, children }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  // null until first opened, so the dialog never renders on the server
  const [deleteOpen, setDeleteOpen] = useState<boolean | null>(null);
  const role = account.role ?? "student";
  const NAV = navFor(role);
  const mobileNav = mobileNavFor(role);
  // the questionnaire unlocks the student journey; mentors and admins have none
  const locked = role === "student" && !journey.profileComplete;
  const initials = (account.full_name || account.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* ---------- desktop sidebar ---------- */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <Logo href="/dashboard" className="px-2" />
        <nav className="mt-8 flex-1 space-y-1" aria-label="Разделы">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, NAV);
            const disabled = locked && item.requiresProfile;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={disabled ? "/profile" : item.href}
                aria-current={active ? "page" : undefined}
                aria-disabled={disabled || undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-brand-700" : "text-ink-soft hover:bg-canvas hover:text-ink",
                  disabled && "text-muted/70 hover:bg-transparent hover:text-muted/70",
                )}
              >
                {active && (
                  <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 35 }} />
                )}
                <Icon className="relative size-[18px]" aria-hidden />
                <span className="relative flex-1">{item.label}</span>
                {disabled && <Lock className="relative size-3.5" aria-label="Сначала заполните анкету" />}
              </Link>
            );
          })}
        </nav>

        {role === "student" && journey.stepsTotal > 0 && (
          <div className="mb-4 rounded-2xl bg-canvas p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-soft">Прогресс маршрута</span>
              <span className="font-bold text-brand-700">{Math.round((journey.stepsDone / journey.stepsTotal) * 100)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-route-500" style={{ width: `${(journey.stepsDone / journey.stepsTotal) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="relative flex items-center gap-3 border-t border-line px-2 pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{account.full_name || ROLE_LABEL[role]}</p>
            <p className="truncate text-xs text-muted">{role === "student" ? account.email : ROLE_LABEL[role]}</p>
          </div>
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
            aria-label="Аккаунт"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="size-4" />
          </button>
          <AnimatePresence>
            {accountOpen && (
              <>
                <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setAccountOpen(false)} />
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-full right-0 z-50 mb-2 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-card"
                >
                  <form action={signOut}>
                    <button type="submit" role="menuitem" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-canvas hover:text-ink">
                      <LogOut className="size-4" aria-hidden /> Выйти
                    </button>
                  </form>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-danger-700 hover:bg-danger-50"
                  >
                    <Trash2 className="size-4" aria-hidden /> Удалить аккаунт
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* ---------- mobile top bar ---------- */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between glass-bar border-b border-line bg-canvas/85 px-4 backdrop-blur-xl lg:hidden">
          <Logo href="/dashboard" />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl text-ink-soft hover:bg-surface"
            aria-expanded={menuOpen}
            aria-label="Меню"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed inset-x-0 top-14 z-30 border-b border-line bg-surface px-4 pb-4 pt-2 shadow-card lg:hidden"
            >
              <nav className="grid gap-1" aria-label="Все разделы" onClick={() => setMenuOpen(false)}>
                {NAV.map((item) => {
                  const disabled = locked && item.requiresProfile;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={disabled ? "/profile" : item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium",
                        isActive(pathname, item.href, NAV) ? "bg-brand-50 text-brand-700" : "text-ink-soft",
                        disabled && "text-muted/70",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {disabled && <Lock className="size-4" aria-hidden />}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-3 border-t border-line pt-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initials}</span>
                  <p className="min-w-0 flex-1 truncate text-sm text-muted">{account.email}</p>
                  <form action={signOut}>
                    <button type="submit" className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-canvas">
                      <LogOut className="size-4" aria-hidden /> Выйти
                    </button>
                  </form>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="mt-2 flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-danger-700 hover:bg-danger-50"
                >
                  <Trash2 className="size-4" aria-hidden /> Удалить аккаунт
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- journey: where am I, what's done, what's next ---------- */}
        {role === "student" && <JourneyBar journey={journey} pathname={pathname} />}

        <main className="flex-1 pb-28 lg:pb-12">{children}</main>

        {deleteOpen !== null && <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} email={account.email} />}

        {/* ---------- mobile bottom nav ---------- */}
        <nav
          style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}
          className="fixed inset-x-0 bottom-0 z-30 glass-bar grid border-t border-line bg-surface/95 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur-xl lg:hidden"
          aria-label="Основные разделы"
        >
          {mobileNav.map((item) => {
            const href = item.href;
            const active = isActive(pathname, href, NAV);
            const disabled = locked && item.requiresProfile;
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={disabled ? "/profile" : href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium",
                  active ? "text-brand-700" : "text-muted",
                  disabled && "opacity-45",
                )}
              >
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-brand-50")}>
                  <Icon className="size-[19px]" aria-hidden />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function JourneyBar({ journey, pathname }: { journey: JourneyState; pathname: string }) {
  const currentIndex = JOURNEY.findIndex((s) => isActive(pathname, s.href));
  const nextIndex = JOURNEY.findIndex((s) => !s.done(journey));

  return (
    <div className="border-b border-line bg-surface/60">
      <ol className="container-page flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none" aria-label="Этапы маршрута">
        {JOURNEY.map((stage, i) => {
          const done = stage.done(journey);
          const current = i === currentIndex;
          const isNext = !current && i === nextIndex;
          const disabled = !journey.profileComplete && i > 0;
          return (
            <li key={stage.href} className="flex shrink-0 items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 text-line-strong" aria-hidden />}
              <Link
                href={disabled ? "/profile" : stage.href}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold transition-colors",
                  current ? "bg-brand-600 text-white" : done ? "text-route-700 hover:bg-route-50" : "text-muted hover:bg-canvas",
                  isNext && "ring-1 ring-coral-400 ring-offset-1 ring-offset-surface text-coral-700",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded-full text-[10px]",
                    current ? "bg-white/25" : done ? "bg-route-500 text-white" : "bg-line text-ink-soft",
                  )}
                >
                  {done && !current ? <Check className="size-2.5" strokeWidth={4} aria-hidden /> : i + 1}
                </span>
                {stage.label}
                {isNext && <span className="sr-only">(следующий этап)</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
