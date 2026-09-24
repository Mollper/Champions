import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { MentorChat } from "@/components/mentor/mentor-chat";
import { MentorAvatar } from "@/components/mentor/mentors-view";
import { getMentorStudents, getStudentMentorship, getThread } from "@/lib/data/mentorship";
import { requireRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Сообщения") };
}

export default async function MessagesPage({ searchParams }: PageProps<"/messages">) {
  const t = await getT();
  const account = await requireRole(["student", "mentor", "admin"], "/messages");
  if (account.role === "admin") redirect("/admin/chats");

  // ---- student: one thread with their mentor
  if (account.role === "student") {
    const current = await getStudentMentorship(account.id);
    if (!current) {
      return (
        <div className="container-page py-6 sm:py-10">
          <PageHeader eyebrow={t("Сообщения")} title={t("Чат с ментором")} />
          <div className="mt-6 rounded-card border border-dashed border-line-strong bg-surface p-8 text-center">
            <MessagesSquare className="mx-auto size-10 text-muted" aria-hidden />
            <p className="mt-3 font-semibold">{t("Пока не с кем переписываться")}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{t("Выбери ментора — после того как он примет заявку, здесь откроется чат.")}</p>
            <Link
              href="/mentors"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("Выбрать ментора")}
            </Link>
          </div>
        </div>
      );
    }
    const name = current.mentor?.display_name ?? "ментор";
    const thread = await getThread(current.mentorship.mentor_id, account.id);
    return (
      <div className="container-page flex h-[calc(100dvh-10rem)] flex-col gap-4 py-4 sm:py-8 lg:h-[calc(100dvh-5rem)]">
        <div className="flex items-center gap-3">
          <MentorAvatar name={name} className="size-11 text-sm" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold">{t(name)}</h1>
            <p className="truncate text-sm text-muted">{current.mentor?.headline}</p>
          </div>
        </div>
        <MentorChat
          className="min-h-0 flex-1"
          mentorId={current.mentorship.mentor_id}
          studentId={account.id}
          me={account.id}
          initial={thread}
          otherName={t(name.split(" ")[0])}
          active={current.mentorship.status === "active"}
        />
      </div>
    );
  }

  // ---- mentor: students on the left, the selected thread on the right
  const students = (await getMentorStudents(account.id)).filter((s) => s.mentorship.status === "active");
  const wanted = (await searchParams).student;
  const selected = students.find((s) => s.student.id === wanted) ?? students[0];
  const thread = selected ? await getThread(account.id, selected.student.id) : [];

  return (
    <div className="container-page py-4 sm:py-8">
      <PageHeader eyebrow={t("Сообщения")} title={t("Чаты с учениками")} />
      {students.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
          {t("Когда примешь заявку ученика, здесь появится чат с ним.")}
        </p>
      ) : (
        <div className="mt-5 grid h-[calc(100dvh-14rem)] grid-cols-1 gap-4 lg:h-[calc(100dvh-11rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:block lg:space-y-1.5 lg:overflow-y-auto lg:px-0">
            {students.map((s) => {
              const name = s.student.full_name || s.student.email || t("Ученик");
              const active = s.student.id === selected?.student.id;
              return (
                <li key={s.student.id} className="shrink-0">
                  <Link
                    href={`/messages?student=${s.student.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-2.5 pr-3",
                      active ? "border-brand-300 bg-brand-50" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <MentorAvatar name={name} className="size-9 text-xs" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t(name)}</span>
                    {s.unread > 0 && (
                      <span className="grid size-5 place-items-center rounded-full bg-coral-500 text-[11px] font-bold text-white">{s.unread}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {selected && (
            <MentorChat
              key={selected.student.id}
              className="min-h-0"
              mentorId={account.id}
              studentId={selected.student.id}
              me={account.id}
              initial={thread}
              otherName={t((selected.student.full_name || "ученик").split(" ")[0])}
              active
            />
          )}
        </div>
      )}
    </div>
  );
}
// UniRoute · src/app/(app)/messages/page.tsx
