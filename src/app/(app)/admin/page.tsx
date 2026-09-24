import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Bot, GraduationCap, MessagesSquare, Sparkles, UserRoundCheck, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { getAdminOverview } from "@/lib/data/admin";
import { requireRole } from "@/lib/roles";
import { currentIntl } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Админ-панель") };
}

const REQUEST_LABEL: Record<string, string> = {
  queued: "в очереди",
  running: "в работе",
  done: "добавлены",
  duplicate: "уже были",
  not_found: "не найдены",
  failed: "ошибка",
};

export default async function AdminHome() {
  const t = await getT();
  await requireRole(["admin"], "/admin");
  const o = await getAdminOverview();

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader eyebrow={t("Админ-панель")} title={t("Обзор")} description={t("Ученики, менторы и работа ИИ за последние дни.")} />

      <Section title={t("Люди")} icon={Users}>
        <Tile label={t("Ученики")} value={o.students} hint={t("+{0} новых за 7 дней", o.newUsers)} />
        <Tile label={t("Менторы")} value={o.mentors} hint={t("{0} активных пар", o.activeMentorships)} href="/admin/chats" />
        <Tile label={t("Заявки менторов")} value={o.pendingApps} hint={t("ждут решения")} href="/admin/applications" attention={o.pendingApps > 0} />
        <Tile label={t("Админы")} value={o.admins} hint={t("с полным доступом")} href="/admin/users" />
      </Section>

      <Section title={t("Общение")} icon={MessagesSquare}>
        <Tile label={t("Ответы Юни")} value={o.assistantReplies} hint={t("за 7 дней")} href="/admin/ai" />
        <Tile label={t("Сообщения менторов")} value={o.mentorMessages} hint={t("за 7 дней")} href="/admin/chats" />
      </Section>

      <Section title={t("Работа ИИ")} icon={Bot}>
        <Tile label={t("Планы от ИИ")} value={o.plansAi} hint={t("{0} по шаблону, когда ИИ был занят", o.plansTemplate)} href="/admin/ai" />
        <Tile label={t("Профили вузов")} value={o.profiles} hint={t("написаны ИИ и закэшированы")} />
        <Tile
          label={t("Заявки на вузы")}
          value={Object.values(o.requestsByStatus).reduce((a, b) => a + b, 0)}
          hint={t(
            Object.entries(o.requestsByStatus)
              .map(([k, v]) => `${REQUEST_LABEL[k] ?? k}: ${v}`)
              .join(" · ") || "за 30 дней нет",
          )}
          href="/admin/ai"
        />
      </Section>

      <Section title={t("Каталог")} icon={GraduationCap}>
        <Tile label={t("Опубликовано вузов")} value={o.published} hint={t("{0} предложено ИИ", o.aiPublished)} />
        <Tile label={t("Черновики ИИ")} value={o.drafts} hint={t("без фото или стоимости — скрыты")} href="/admin/ai" />
      </Section>

      <p className="flex items-center gap-2 text-xs text-muted">
        <Sparkles className="size-3.5" aria-hidden /> {t("Данные читаются сервисным ключом в обход RLS — страница доступна только администраторам.")}
      </p>
    </div>
  );
}

async function Section({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  const t = await getT();
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-brand-600" aria-hidden /> {t(title)}
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

async function Tile({ label, value, hint, href, attention }: { label: string; value: number; hint: string; href?: string; attention?: boolean }) {
  const t = await getT();
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {attention && <UserRoundCheck className="size-3.5 text-coral-600" aria-label={t("требует внимания")} />}
        {t(label)}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">{value.toLocaleString(currentIntl())}</p>
      <p className="mt-1 text-xs leading-snug text-ink-soft">{t(hint)}</p>
    </>
  );
  const cls = "block min-w-0 rounded-card border border-line bg-surface p-4";
  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:shadow-card`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
// UniRoute · src/app/(app)/admin/page.tsx
