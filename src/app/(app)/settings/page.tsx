import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Bot, Languages, Palette, UserRound } from "lucide-react";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/app/page-header";
import { AccountActions, AssistantStylePicker } from "@/components/settings/account-settings";
import { LanguagePicker } from "@/components/settings/language-switcher";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { ThemeControls } from "@/components/settings/theme-controls";
import { toAssistantStyle } from "@/lib/constants";
import { getProfile } from "@/lib/data/profile";
import { ROLE_LABEL } from "@/lib/role-labels";
import { requireRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Настройки") };
}

export default async function SettingsPage() {
  const t = await getT();
  const account = await requireRole(["student", "mentor", "admin"], "/settings");
  const supabase = await createClient();
  const [profile, jar, authUser] = await Promise.all([
    getProfile(account.id),
    cookies(),
    supabase.auth.getUser().then((r) => r.data.user),
  ]);
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  const needsCurrentPassword = authUser?.app_metadata?.provider === "email";

  return (
    <div className="container-page max-w-4xl space-y-5 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Настройки")}
        title={t("Под себя")}
        description={t("Цвета, тема, язык и аккаунт. Изменения применяются сразу и запоминаются на этом устройстве.")}
      />

      <Section icon={UserRound} title={t("Профиль")}>
        <ProfileEditor
          userId={account.id}
          name={account.full_name}
          email={account.email}
          avatarUrl={account.avatar_url}
          needsCurrentPassword={needsCurrentPassword}
        />
      </Section>

      <Section icon={Palette} title={t("Оформление")}>
        <ThemeControls initial={theme} />
      </Section>

      <Section icon={Languages} title={t("Язык интерфейса")}>
        <LanguagePicker />
      </Section>

      {account.role === "student" && (
        <Section icon={Bot} title={t("Стиль ИИ-помощника Юни")}>
          <AssistantStylePicker initial={toAssistantStyle(profile?.assistant_style)} />
        </Section>
      )}

      <Section icon={UserRound} title={t("Аккаунт")}>
        <dl className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">{t("Роль")}</dt>
            <dd className="font-medium">{t(ROLE_LABEL[account.role])}</dd>
          </div>
        </dl>
        <AccountActions email={account.email} />
      </Section>
    </div>
  );
}

async function Section({ icon: Icon, title, children }: { icon: typeof Palette; title: string; children: React.ReactNode }) {
  const t = await getT();
  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-brand-600" aria-hidden /> {t(title)}
      </h2>
      {children}
    </section>
  );
}
// UniRoute · src/app/(app)/settings/page.tsx
