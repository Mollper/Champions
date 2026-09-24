import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EndMentorshipButton } from "@/components/admin/admin-ui";
import { getMentorChats } from "@/lib/data/admin";
import { requireRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { currentIntl } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Чаты менторов") };
}

const STATUS: Record<string, string> = { pending: "заявка", active: "активно", ended: "завершено" };

export default async function MentorChatsPage({ searchParams }: PageProps<"/admin/chats">) {
  const t = await getT();
  await requireRole(["admin"], "/admin/chats");
  const params = await searchParams;
  const selected = typeof params.mentor === "string" && typeof params.student === "string" ? { mentor: params.mentor, student: params.student } : null;
  const { links, thread } = await getMentorChats(selected);
  const current = selected ? links.find((l) => l.mentor_id === selected.mentor && l.student_id === selected.student) : null;
  const name = (u?: { full_name: string | null; email: string | null } | null) => u?.full_name || u?.email || "—";

  return (
    <div className="container-page space-y-5 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Админ-панель")}
        title={t("Чаты менторов")}
        description={t("Пары ментор–ученик и их переписка (только чтение) — для разбора жалоб и контроля качества.")}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <ul className="space-y-2">
          {links.map((l) => {
            const active = current && l.mentor_id === current.mentor_id && l.student_id === current.student_id;
            return (
              <li key={`${l.mentor_id}-${l.student_id}`}>
                <Link
                  href={`/admin/chats?mentor=${l.mentor_id}&student=${l.student_id}`}
                  className={cn("block rounded-2xl border p-3", active ? "border-brand-300 bg-brand-50" : "border-line bg-surface hover:border-line-strong")}
                >
                  <p className="truncate text-sm font-semibold">
                    {t(name(l.mentor))} → {t(name(l.student))}
                  </p>
                  <p className="text-xs text-muted">
                    {t(STATUS[l.status] ?? l.status)} · {new Date(l.updated_at).toLocaleDateString(currentIntl())}
                  </p>
                </Link>
              </li>
            );
          })}
          {links.length === 0 && <li className="text-sm text-muted">{t("Наставничеств пока нет.")}</li>}
        </ul>

        <section className="min-w-0 rounded-card border border-line bg-surface p-4">
          {!current ? (
            <p className="py-10 text-center text-sm text-muted">{t("Выбери пару слева, чтобы посмотреть переписку.")}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <p className="text-sm font-semibold">
                  {t(name(current.mentor))} ↔ {t(name(current.student))}
                </p>
                {current.status !== "ended" && <EndMentorshipButton mentorId={current.mentor_id} studentId={current.student_id} />}
              </div>
              <ul className="mt-3 max-h-[60dvh] space-y-2 overflow-y-auto">
                {thread.map((m) => {
                  const byMentor = m.sender_id === current.mentor_id;
                  return (
                    <li key={m.id} className={cn("flex", byMentor ? "justify-start" : "justify-end")}>
                      <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm [overflow-wrap:anywhere]", byMentor ? "bg-brand-50" : "bg-canvas")}>
                        <p className="text-[11px] font-semibold text-muted">
                          {t(byMentor ? "ментор" : "ученик")} ·{" "}
                          {new Date(m.created_at).toLocaleString(currentIntl(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </li>
                  );
                })}
                {thread.length === 0 && <li className="py-6 text-center text-sm text-muted">{t("Сообщений нет.")}</li>}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
// UniRoute · src/app/(app)/admin/chats/page.tsx
