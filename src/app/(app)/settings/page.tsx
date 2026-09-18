import type { Metadata } from "next";
import { Bot, Languages, Palette, UserRound } from "lucide-react";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/app/page-header";
import { AccountActions, AssistantStylePicker } from "@/components/settings/account-settings";
import { ThemeControls } from "@/components/settings/theme-controls";
import { toAssistantStyle } from "@/lib/constants";
import { getProfile } from "@/lib/data/profile";
import { ROLE_LABEL } from "@/lib/role-labels";
import { requireRole } from "@/lib/roles";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const account = await requireRole(["student", "mentor", "admin"], "/settings");
  const [profile, jar] = await Promise.all([getProfile(account.id), cookies()]);
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  return (
    <div className="container-page max-w-4xl space-y-5 py-6 sm:py-10">
      <PageHeader eyebrow="Настройки" title="Под себя" description="Цвета, тема, язык и аккаунт. Изменения применяются сразу и запоминаются на этом устройстве." />

      <Section icon={Palette} title="Оформление">
        <ThemeControls initial={theme} />
      </Section>

      <Section icon={Languages} title="Язык интерфейса">
        <div id="language-settings" />
      </Section>

      {account.role === "student" && (
        <Section icon={Bot} title="Стиль ИИ-помощника Юни">
          <AssistantStylePicker initial={toAssistantStyle(profile?.assistant_style)} />
        </Section>
      )}

      <Section icon={UserRound} title="Аккаунт">
        <dl className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Имя</dt>
            <dd className="font-medium">{account.full_name || "—"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted">Почта</dt>
            <dd className="truncate font-medium">{account.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Роль</dt>
            <dd className="font-medium">{ROLE_LABEL[account.role]}</dd>
          </div>
        </dl>
        <AccountActions email={account.email} />
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Palette; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-brand-600" aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );
}
