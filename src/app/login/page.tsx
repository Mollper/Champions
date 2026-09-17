import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUserId, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Вход" };

const PERKS = [
  { icon: Sparkles, text: "Диагностика профиля и оценка шансов" },
  { icon: GraduationCap, text: "Подбор вузов с объяснением «почему подходит»" },
  { icon: CalendarCheck2, text: "Пошаговый план с дедлайнами и прогрессом" },
  { icon: ShieldCheck, text: "Ответы видишь только ты — данные защищены" },
] as const;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next, "");

  if (await getCurrentUserId()) redirect(next || "/dashboard");

  const mode = params.mode === "signup" ? "signup" : "signin";
  const linkError = params.error === "link";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div aria-hidden className="absolute -left-24 top-1/3 size-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 right-0 size-80 rounded-full bg-route-500/30 blur-3xl" />

        <div className="relative">
          <Logo inverted />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            5 минут на анкету — и у тебя есть план поступления
          </h2>
          <ul className="mt-8 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
                  <Icon className="size-5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">Бесплатно · без рекламы · можно удалить аккаунт в любой момент</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <AuthForm initialMode={mode} next={next} linkError={linkError} />
        </div>
      </main>
    </div>
  );
}
