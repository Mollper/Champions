"use server";

import { revalidatePath } from "next/cache";
import { loadAssistantContext } from "@/lib/assistant/context";
import { getCurrentUserId } from "@/lib/auth";
import { EXAMS } from "@/lib/constants";
import { examScoreError } from "@/lib/exams";
import { generatePlan } from "@/lib/planner/generate";
import { HORIZONS, HOURS, MAX_PLANS, PLAN_KINDS, PLANS_PER_DAY } from "@/lib/planner/options";
import { createClient } from "@/lib/supabase/server";
import type { Plan, PlanKind, PlanParams } from "@/types/models";

export type PlanInput = { kind: PlanKind } & PlanParams;
export type CreatePlanResult = { ok: true; plan: Plan } | { ok: false; error: string };

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

/** Whitelist the form; returns a message for the first problem. */
function validate(input: PlanInput): { kind: PlanKind; params: PlanParams } | string {
  const kind = PLAN_KINDS.find((k) => k.kind === input?.kind)?.kind;
  if (!kind) return "Выбери тип плана.";
  const horizon = HORIZONS.find((h) => h.value === input.horizon)?.value;
  if (!horizon) return "Выбери срок плана.";
  const hoursPerWeek = (HOURS as readonly number[]).includes(input.hoursPerWeek) ? input.hoursPerWeek : null;
  if (!hoursPerWeek) return "Выбери, сколько часов в неделю готов уделять.";

  const params: PlanParams = { horizon, hoursPerWeek, wishes: text(input.wishes, 300) };
  if (kind === "exam") {
    const exam = EXAMS.find((e) => e.type === input.exam)?.type;
    if (!exam) return "Выбери экзамен.";
    const target = typeof input.target === "number" ? input.target : NaN;
    const error = examScoreError(exam, target);
    if (error) return `Целевой балл: ${error}`;
    Object.assign(params, { exam, target });
  }
  if (kind === "custom") {
    const goal = text(input.goal, 300);
    if (!goal || goal.length < 5) return "Опиши цель плана хотя бы парой слов.";
    params.goal = goal;
  }
  return { kind, params };
}

export async function createPlan(input: PlanInput): Promise<CreatePlanResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };
  const valid = validate(input);
  if (typeof valid === "string") return { ok: false, error: valid };

  const supabase = await createClient();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: today }, { count: total }] = await Promise.all([
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", dayAgo),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  if ((today ?? 0) >= PLANS_PER_DAY) return { ok: false, error: `Сегодня уже создано ${PLANS_PER_DAY} планов — продолжим завтра.` };
  if ((total ?? 0) >= MAX_PLANS) return { ok: false, error: `Сохранено ${MAX_PLANS} планов — удали ненужные, чтобы создать новый.` };

  const ctx = await loadAssistantContext(userId);
  let generated;
  try {
    generated = await generatePlan(valid.kind, valid.params, ctx);
  } catch (error) {
    console.error("[planner] generation failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "Не получилось составить план. Попробуй ещё раз через минуту." };
  }

  const { data, error } = await supabase
    .from("plans")
    .insert({ user_id: userId, kind: valid.kind, title: generated.title, params: valid.params, content: generated.content, model: generated.model })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: "План составлен, но не сохранился. Попробуй ещё раз." };

  revalidatePath("/planner");
  return { ok: true, plan: data as unknown as Plan };
}

export async function setPlanTask(planId: number, taskKey: string, done: boolean): Promise<{ ok: boolean }> {
  const userId = await getCurrentUserId();
  if (!userId || !/^p\d+-t\d+$/.test(taskKey)) return { ok: false };
  const supabase = await createClient();
  const { data: plan } = await supabase.from("plans").select("done").eq("id", planId).eq("user_id", userId).maybeSingle();
  if (!plan) return { ok: false };
  const next = done ? [...new Set([...plan.done, taskKey])] : plan.done.filter((k) => k !== taskKey);
  const { error } = await supabase.from("plans").update({ done: next }).eq("id", planId).eq("user_id", userId);
  return { ok: !error };
}

export async function deletePlan(planId: number): Promise<{ ok: boolean }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("plans").delete().eq("id", planId).eq("user_id", userId);
  revalidatePath("/planner");
  return { ok: !error };
}
// UniRoute · src/app/(app)/planner/actions.ts
