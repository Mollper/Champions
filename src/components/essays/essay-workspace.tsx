"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, FileText, Loader2, Plus, Quote, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { deleteEssay, requestReview, saveEssay } from "@/app/(app)/essays/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { Essay, EssayKind, EssayReview, EssayScores } from "@/types/models";

const KIND_LABEL: Record<EssayKind, string> = { motivation_letter: "Мотивационное письмо", personal_statement: "Personal Statement" };
let draftSeq = 0;
const nextDraftId = () => `draft-${++draftSeq}`;

const CRITERIA: { key: keyof EssayScores; label: string }[] = [
  { key: "clarity", label: "Ясность" },
  { key: "structure", label: "Структура" },
  { key: "specificity", label: "Конкретика" },
  { key: "authenticity", label: "Аутентичность" },
  { key: "impact", label: "Запоминаемость" },
];

function scoreTone(score: number) {
  if (score >= 80) return "text-success-700";
  if (score >= 60) return "text-brand-700";
  if (score >= 40) return "text-warn-700";
  return "text-danger-700";
}

function draftWordCount(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function EssayWorkspace({ initialEssays, initialReviews }: { initialEssays: Essay[]; initialReviews: Record<string, EssayReview[]> }) {
  const t = useT();
  const [essays, setEssays] = useState(initialEssays);
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedId, setSelectedId] = useState<string | null>(initialEssays[0]?.id ?? null);
  const [creating, setCreating] = useState(false);

  const selected = essays.find((e) => e.id === selectedId) ?? null;

  const startNew = (kind: EssayKind) => {
    const draft: Essay = {
      id: nextDraftId(),
      user_id: "",
      kind,
      title: "",
      target: null,
      prompt: null,
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEssays((list) => [draft, ...list]);
    setSelectedId(draft.id);
    setCreating(false);
  };

  const onSaved = (essay: Essay) => {
    setEssays((list) => {
      const withoutOld = list.filter((e) => e.id !== selectedId && e.id !== essay.id);
      return [essay, ...withoutOld];
    });
    setSelectedId(essay.id);
  };

  const onDeleted = (id: string) => {
    setEssays((list) => list.filter((e) => e.id !== id));
    setReviews((r) => Object.fromEntries(Object.entries(r).filter(([key]) => key !== id)));
    setSelectedId((cur) => (cur === id ? (essays.find((e) => e.id !== id)?.id ?? null) : cur));
  };

  const onReviewed = (essayId: string, review: EssayReview) => {
    setReviews((r) => ({ ...r, [essayId]: [review, ...(r[essayId] ?? [])] }));
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="relative">
          <Button type="button" variant="soft" className="w-full justify-between" onClick={() => setCreating((v) => !v)}>
            <span className="flex items-center gap-2">
              <Plus className="size-4" aria-hidden /> {t("Новый черновик")}
            </span>
            <ChevronDown className={cn("size-4 transition-transform", creating && "rotate-180")} aria-hidden />
          </Button>
          <AnimatePresence>
            {creating && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute inset-x-0 top-full z-10 mt-1.5 space-y-1 rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
              >
                {(Object.keys(KIND_LABEL) as EssayKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => startNew(kind)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-canvas"
                  >
                    <FileText className="size-4 text-brand-600" aria-hidden /> {t(KIND_LABEL[kind])}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ul className="space-y-1.5">
          {essays.map((e) => {
            const latest = reviews[e.id]?.[0];
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                    e.id === selectedId ? "border-brand-400 bg-brand-50" : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  <FileText className="size-4 shrink-0 text-ink-soft" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{e.title || t(KIND_LABEL[e.kind])}</span>
                    <span className="block truncate text-xs text-muted">{t(KIND_LABEL[e.kind])}</span>
                  </span>
                  {latest && <span className={cn("shrink-0 text-xs font-bold", scoreTone(latest.score))}>{latest.score}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {essays.length === 0 && <p className="px-1 text-sm text-muted">{t("Пока нет ни одного черновика — начните с кнопки выше.")}</p>}
      </div>

      {selected ? (
        <EssayEditor key={selected.id} essay={selected} reviews={reviews[selected.id] ?? []} onSaved={onSaved} onDeleted={onDeleted} onReviewed={onReviewed} />
      ) : (
        <div className="grid place-items-center rounded-card border border-dashed border-line p-10 text-center text-sm text-muted">
          {t("Выберите черновик слева или создайте новый.")}
        </div>
      )}
    </div>
  );
}

function EssayEditor({
  essay,
  reviews,
  onSaved,
  onDeleted,
  onReviewed,
}: {
  essay: Essay;
  reviews: EssayReview[];
  onSaved: (essay: Essay) => void;
  onDeleted: (id: string) => void;
  onReviewed: (essayId: string, review: EssayReview) => void;
}) {
  const t = useT();
  const isDraft = essay.id.startsWith("draft-");
  const [title, setTitle] = useState(essay.title);
  const [target, setTarget] = useState(essay.target ?? "");
  const [prompt, setPrompt] = useState(essay.prompt ?? "");
  const [content, setContent] = useState(essay.content);
  const [dirty, setDirty] = useState(isDraft);
  const [error, setError] = useState<string | null>(null);
  const [savePending, startSave] = useTransition();
  const [reviewPending, startReview] = useTransition();
  const [reviewError, setReviewError] = useState<string | null>(null);

  const words = useMemo(() => draftWordCount(content), [content]);
  const latest = reviews[0];

  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
    setError(null);
  };

  const save = () => {
    const fd = new FormData();
    fd.set("kind", essay.kind);
    fd.set("title", title);
    fd.set("target", target);
    fd.set("prompt", prompt);
    fd.set("content", content);
    startSave(async () => {
      const result = await saveEssay(isDraft ? null : essay.id, fd);
      if (!result.ok) return setError(result.error);
      setDirty(false);
      onSaved(result.essay);
    });
  };

  const review = () => {
    if (dirty || isDraft) return setReviewError(t("Сначала сохраните черновик."));
    setReviewError(null);
    startReview(async () => {
      const result = await requestReview(essay.id);
      if (!result.ok) return setReviewError(result.error);
      onReviewed(essay.id, result.review);
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-surface p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("Название (для себя)")} htmlFor="essay-title">
            <Input id="essay-title" value={title} maxLength={200} placeholder={t(KIND_LABEL[essay.kind])} onChange={(e) => change(setTitle)(e.target.value)} />
          </Field>
          <Field label={t("Куда подаётся")} htmlFor="essay-target" hint={t("необязательно")}>
            <Input id="essay-target" value={target} maxLength={300} placeholder="MIT, Common App…" onChange={(e) => change(setTarget)(e.target.value)} />
          </Field>
        </div>
        <Field label={t("Вопрос эссе")} htmlFor="essay-prompt" hint={t("необязательно")} className="mt-3">
          <Input id="essay-prompt" value={prompt} maxLength={1000} placeholder={t("Например: Describe a challenge you overcame")} onChange={(e) => change(setPrompt)(e.target.value)} />
        </Field>
        <Field label={t("Текст")} htmlFor="essay-content" hint={t("{0} слов", words)} className="mt-3">
          <Textarea id="essay-content" value={content} maxLength={20000} className="min-h-72" onChange={(e) => change(setContent)(e.target.value)} />
        </Field>
        {error && (
          <p className="mt-2 text-sm font-medium text-danger-700" role="alert">
            {t(error)}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={save} disabled={savePending || !dirty || content.trim().length < 10}>
            {savePending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />} {t("Сохранить")}
          </Button>
          <Button type="button" variant="soft" onClick={review} disabled={reviewPending || isDraft}>
            {reviewPending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} {t("Оценить с ИИ")}
          </Button>
          {!isDraft && (
            <button
              type="button"
              onClick={() => deleteEssay(essay.id).then((r) => r.ok && onDeleted(essay.id))}
              className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-danger-700 hover:bg-danger-50"
            >
              <Trash2 className="size-4" aria-hidden /> {t("Удалить")}
            </button>
          )}
        </div>
        {reviewError && (
          <p className="mt-2 text-sm font-medium text-danger-700" role="alert">
            {t(reviewError)}
          </p>
        )}
      </div>

      {latest && <ReviewCard review={latest} />}

      {reviews.length > 1 && (
        <details className="rounded-card border border-line bg-surface p-4 sm:p-6">
          <summary className="cursor-pointer text-sm font-semibold">{t("История проверок ({0})", reviews.length - 1)}</summary>
          <ul className="mt-3 space-y-2">
            {reviews.slice(1).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
                <span className="text-muted">{new Date(r.created_at).toLocaleString()}</span>
                <span className={cn("font-bold", scoreTone(r.score))}>{r.score}/100</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: EssayReview }) {
  const t = useT();
  const { review: r, score } = review;
  return (
    <div className="rounded-card border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{t("Оценка ИИ")}</h3>
        <span className={cn("text-2xl font-bold", scoreTone(score))}>{score}/100</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(r.summary)}</p>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
        {CRITERIA.map((c) => {
          const v = r.scores[c.key];
          return (
            <div key={c.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">{t(c.label)}</span>
                <span className="font-semibold">{v}/20</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                <div className={cn("h-full rounded-full", v >= 14 ? "bg-success-500" : v >= 9 ? "bg-brand-500" : "bg-warn-500")} style={{ width: `${(v / 20) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-success-700">{t("Сильные стороны")}</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">
            {r.strengths.map((s, i) => (
              <li key={i}>• {t(s)}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-danger-700">{t("Слабые места")}</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">
            {r.weaknesses.map((s, i) => (
              <li key={i}>• {t(s)}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t("Что исправить")}</p>
        <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">
          {r.suggestions.map((s, i) => (
            <li key={i}>
              {i + 1}. {t(s)}
            </li>
          ))}
        </ul>
      </div>

      {r.cliches.length > 0 && (
        <div className="mt-4 rounded-xl bg-warn-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warn-700">
            <Quote className="size-3.5" aria-hidden /> {t("Избитые фразы")}
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-warn-700">
            {r.cliches.map((c, i) => (
              <li key={i}>«{c}»</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
// UniRoute · src/components/essays/essay-workspace.tsx
