import type { Metadata } from "next";
import { ArrowLeft, CalendarCheck2, Check, Heart, Route, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MentorChat } from "@/components/mentor/mentor-chat";
import { MentorAvatar } from "@/components/mentor/mentors-view";
import { TierBadge } from "@/components/university/chance";
import { BUDGETS, COUNTRY_NAME, FIELD_LABEL, GRADE_LABEL } from "@/lib/constants";
import { toDraft } from "@/lib/data/profile";
import { getThread } from "@/lib/data/mentorship";
import { getScholarships, getUniversities } from "@/lib/data/reference";
import { diagnose } from "@/lib/engine/diagnose";
import { isRecommended, matchUniversities } from "@/lib/engine/match";
import { formatScore } from "@/lib/exams";
import { formatDate, formatUsd } from "@/lib/format";
import { requireRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { Plan, Profile } from "@/types/models";

export const metadata: Metadata = { title: "Ученик" };

export default async function MentorStudentPage({ params }: PageProps<"/mentor/students/[id]">) {
  const { id } = await params;
  const account = await requireRole(["mentor"], `/mentor/students/${id}`);
  const supabase = await createClient();

  // RLS lets a mentor read a student's data only while the mentorship is active
  const { data: link } = await supabase.from("mentorships").select("status").eq("mentor_id", account.id).eq("student_id", id).maybeSingle();
  if (link?.status !== "active") notFound();

  const [{ data: student }, { data: profile }, { data: steps }, { data: plans }, { data: favorites }, universities, scholarships, thread] = await Promise.all([
    supabase.from("users").select("full_name, email").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("roadmap_steps").select("title, status, due_date, category").eq("user_id", id).order("due_date", { nullsFirst: false }),
    supabase.from("plans").select("id, title, kind, done, content, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("favorites").select("university_id").eq("user_id", id),
    getUniversities(),
    getScholarships(),
    getThread(account.id, id),
  ]);

  const name = student?.full_name || student?.email || "Ученик";
  const draft = toDraft((profile as Profile | null) ?? null);
  const complete = Boolean(profile?.completed_at);
  const matches = matchUniversities(draft, universities, scholarships);
  const recommended = matches.filter((m) => isRecommended(m, draft));
  const diagnosis = diagnose(draft, matches);
  const doneSteps = (steps ?? []).filter((s) => s.status === "done").length;
  const nextSteps = (steps ?? []).filter((s) => s.status !== "done" && s.status !== "skipped").slice(0, 5);
  const favoriteNames = (favorites ?? []).map((f) => universities.find((u) => u.id === f.university_id)).filter((u) => u !== undefined);

  return (
    <div className="container-page space-y-5 py-5 sm:py-8">
      <Link href="/mentor" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Все ученики
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <section className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 sm:p-5">
            <MentorAvatar name={name} className="size-14 text-lg" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-2xl font-semibold">{name}</h1>
              <p className="truncate text-sm text-muted">{student?.email}</p>
            </div>
            {complete && (
              <div className="text-right">
                <p className="font-display text-2xl font-semibold text-brand-700">{diagnosis.readiness.score}</p>
                <p className="text-[11px] text-muted">готовность</p>
              </div>
            )}
          </section>

          {!complete ? (
            <p className="rounded-card border border-dashed border-line-strong bg-surface p-5 text-sm text-ink-soft">Ученик ещё не заполнил анкету — подскажи ему начать с неё.</p>
          ) : (
            <>
              <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
                <h2 className="font-semibold">Анкета</h2>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <Fact label="Класс" value={GRADE_LABEL[draft.grade ?? 0] ?? "—"} />
                  <Fact label="Средний балл" value={draft.gpa != null ? `${draft.gpa} из ${draft.gpa_scale}` : "—"} />
                  <Fact label="Интересы" value={draft.interests.map((f) => FIELD_LABEL[f] ?? f).join(", ") || "—"} />
                  <Fact label="Страны" value={draft.target_countries.map((c) => COUNTRY_NAME[c] ?? c).join(", ") || "любые"} />
                  <Fact label="Экзамены" value={draft.exams.map((e) => `${e.type} ${formatScore(e.type, e.score)}${e.status === "planned" ? " (цель)" : ""}`).join(", ") || "нет"} />
                  <Fact label="Бюджет" value={BUDGETS.find((b) => b.value === draft.budget_usd_per_year)?.label ?? "—"} />
                  {draft.goal && <Fact label="Цель" value={draft.goal} />}
                </dl>
              </section>

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-card border border-line bg-surface p-4">
                  <h2 className="font-semibold text-success-700">Сильные стороны</h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                    {diagnosis.strengths.map((s) => (
                      <li key={s.title} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success-500" aria-hidden /> {s.title}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-card border border-line bg-surface p-4">
                  <h2 className="font-semibold text-warn-700">Над чем работать</h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                    {diagnosis.limitations.map((s) => (
                      <li key={s.title} className="flex gap-2">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn-500" aria-hidden /> {s.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
                <h2 className="font-semibold">Подборка · {recommended.length}</h2>
                <ul className="mt-3 divide-y divide-line">
                  {recommended.slice(0, 6).map((m) => (
                    <li key={m.university.id} className="flex flex-wrap items-center gap-2 py-2.5">
                      <Link href={`/universities/${m.university.slug}`} className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-brand-700">
                        {m.university.name}
                      </Link>
                      <span className="text-xs text-muted">≈{formatUsd(m.costs.net)}/год</span>
                      <TierBadge tier={m.tier} chance={m.chance} />
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Route className="size-4 text-brand-600" aria-hidden /> Маршрут · {doneSteps}/{steps?.length ?? 0}
                </h2>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {nextSteps.map((s) => (
                    <li key={s.title} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate text-ink-soft">{s.title}</span>
                      <span className="shrink-0 text-xs text-muted">{s.due_date ? formatDate(s.due_date) : ""}</span>
                    </li>
                  ))}
                  {nextSteps.length === 0 && <li className="text-muted">Все шаги выполнены или маршрут ещё не построен.</li>}
                </ul>
              </section>

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-card border border-line bg-surface p-4">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <CalendarCheck2 className="size-4 text-brand-600" aria-hidden /> Планы
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {((plans ?? []) as unknown as Pick<Plan, "id" | "title" | "done" | "content">[]).map((p) => {
                      const total = p.content.periods.reduce((a, x) => a + x.tasks.length, 0);
                      return (
                        <li key={p.id} className="flex justify-between gap-3">
                          <span className="min-w-0 truncate text-ink-soft">{p.title}</span>
                          <span className="shrink-0 text-xs font-semibold">{total ? Math.round((p.done.length / total) * 100) : 0}%</span>
                        </li>
                      );
                    })}
                    {!plans?.length && <li className="text-muted">Планов пока нет.</li>}
                  </ul>
                </div>
                <div className="rounded-card border border-line bg-surface p-4">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Heart className="size-4 text-coral-600" aria-hidden /> Избранное
                  </h2>
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {favoriteNames.slice(0, 8).map((u) => (
                      <li key={u.id} className="truncate">
                        {u.name}
                      </li>
                    ))}
                    {favoriteNames.length === 0 && <li className="text-muted">Пусто.</li>}
                  </ul>
                </div>
              </section>
            </>
          )}
        </div>

        <MentorChat
          className="h-[70dvh] lg:sticky lg:top-6 lg:h-[calc(100dvh-7rem)]"
          mentorId={account.id}
          studentId={id}
          me={account.id}
          initial={thread}
          otherName={name.split(" ")[0]}
          active
        />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}
