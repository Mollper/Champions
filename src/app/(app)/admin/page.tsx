import type { Metadata } from "next";
import { Bot, GraduationCap, MessagesSquare, Sparkles, UserRoundCheck, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { getAdminOverview } from "@/lib/data/admin";
import { requireRole } from "@/lib/roles";

export const metadata: Metadata = { title: "Админ-панель" };

const REQUEST_LABEL: Record<string, string> = { queued: "в очереди", running: "в работе", done: "добавлены", duplicate: "уже были", not_found: "не найдены", failed: "ошибка" };

export default async function AdminHome() {
  await requireRole(["admin"], "/admin");
  const o = await getAdminOverview();

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader eyebrow="Админ-панель" title="Обзор" description="Ученики, менторы и работа ИИ за последние дни." />

      <Section title="Люди" icon={Users}>
        <Tile label="Ученики" value={o.students} hint={`+${o.newUsers} новых за 7 дней`} />
        <Tile label="Менторы" value={o.mentors} hint={`${o.activeMentorships} активных пар`} href="/admin/chats" />
        <Tile label="Заявки менторов" value={o.pendingApps} hint="ждут решения" href="/admin/applications" attention={o.pendingApps > 0} />
        <Tile label="Админы" value={o.admins} hint="с полным доступом" href="/admin/users" />
      </Section>

      <Section title="Общение" icon={MessagesSquare}>
        <Tile label="Ответы Юни" value={o.assistantReplies} hint="за 7 дней" href="/admin/ai" />
        <Tile label="Сообщения менторов" value={o.mentorMessages} hint="за 7 дней" href="/admin/chats" />
      </Section>

      <Section title="Работа ИИ" icon={Bot}>
        <Tile label="Планы от ИИ" value={o.plansAi} hint={`${o.plansTemplate} по шаблону, когда ИИ был занят`} href="/admin/ai" />
        <Tile label="Профили вузов" value={o.profiles} hint="написаны ИИ и закэшированы" />
        <Tile
          label="Заявки на вузы"
          value={Object.values(o.requestsByStatus).reduce((a, b) => a + b, 0)}
          hint={
            Object.entries(o.requestsByStatus)
              .map(([k, v]) => `${REQUEST_LABEL[k] ?? k}: ${v}`)
              .join(" · ") || "за 30 дней нет"
          }
          href="/admin/ai"
        />
      </Section>

      <Section title="Каталог" icon={GraduationCap}>
        <Tile label="Опубликовано вузов" value={o.published} hint={`${o.aiPublished} предложено ИИ`} />
        <Tile label="Черновики ИИ" value={o.drafts} hint="без фото или стоимости — скрыты" href="/admin/ai" />
      </Section>

      <p className="flex items-center gap-2 text-xs text-muted">
        <Sparkles className="size-3.5" aria-hidden /> Данные читаются сервисным ключом в обход RLS — страница доступна только администраторам.
      </p>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-brand-600" aria-hidden /> {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Tile({ label, value, hint, href, attention }: { label: string; value: number; hint: string; href?: string; attention?: boolean }) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {attention && <UserRoundCheck className="size-3.5 text-coral-600" aria-label="требует внимания" />}
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">{value.toLocaleString("ru-RU")}</p>
      <p className="mt-1 text-xs leading-snug text-ink-soft">{hint}</p>
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
