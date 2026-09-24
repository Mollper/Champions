"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { getAccountWithRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const fail = (error: string): ActionResult => ({ ok: false, error });

/* ------------------------------------------------------------------ students */

export async function requestMentor(mentorId: string, note: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return fail("Сессия истекла — войдите снова.");
  if (mentorId === userId) return fail("Нельзя выбрать себя ментором.");
  const supabase = await createClient();
  const { data: mine } = await supabase.from("mentorships").select("mentor_id, status").eq("student_id", userId);
  if (mine?.some((m) => m.status !== "ended")) return fail("У тебя уже есть ментор или открытая заявка. Сначала заверши её.");
  // asking a former mentor again reopens the old thread instead of starting a new one
  const { error } = mine?.some((m) => m.mentor_id === mentorId)
    ? await supabase.from("mentorships").update({ status: "pending" }).eq("mentor_id", mentorId).eq("student_id", userId)
    : await supabase.from("mentorships").insert({ mentor_id: mentorId, student_id: userId, note: text(note, 500) || null });
  if (error) return fail("Не удалось отправить заявку ментору. Возможно, он сейчас не принимает учеников.");
  revalidatePath("/mentors");
  return { ok: true };
}

export async function leaveMentor(mentorId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return fail("Сессия истекла — войдите снова.");
  const supabase = await createClient();
  const { data } = await supabase.from("mentorships").select("status").eq("mentor_id", mentorId).eq("student_id", userId).maybeSingle();
  if (!data) return fail("Заявка не найдена.");
  const { error } =
    data.status === "pending"
      ? await supabase.from("mentorships").delete().eq("mentor_id", mentorId).eq("student_id", userId)
      : await supabase.from("mentorships").update({ status: "ended" }).eq("mentor_id", mentorId).eq("student_id", userId);
  if (error) return fail("Не получилось. Попробуй ещё раз.");
  revalidatePath("/mentors");
  revalidatePath("/messages");
  return { ok: true };
}

/* ------------------------------------------------------------------ mentors */

export async function respondToStudent(studentId: string, accept: boolean): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return fail("Сессия истекла — войдите снова.");
  const account = await getAccountWithRole(userId);
  if (account.role !== "mentor" && account.role !== "admin") return fail("Это действие доступно менторам.");
  const supabase = await createClient();
  const { error } = await supabase.from("mentorships").update({ status: accept ? "active" : "ended" }).eq("mentor_id", userId).eq("student_id", studentId);
  if (error) return fail("Не удалось обновить заявку.");
  revalidatePath("/mentor");
  return { ok: true };
}

export async function updateMentorCard(form: { headline: string; bio: string; expertise: string[]; accepting: boolean }): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return fail("Сессия истекла — войдите снова.");
  const headline = text(form.headline, 160);
  if (headline.length < 5) return fail("Коротко опиши, с чем помогаешь (от 5 символов).");
  const expertise = [...new Set((Array.isArray(form.expertise) ? form.expertise : []).map((e) => text(e, 40)).filter(Boolean))].slice(0, 12);
  const supabase = await createClient();
  const { error } = await supabase
    .from("mentor_profiles")
    .update({ headline, bio: text(form.bio, 3000), expertise, accepting: form.accepting === true })
    .eq("user_id", userId);
  if (error) return fail("Не удалось сохранить карточку.");
  revalidatePath("/mentor/profile");
  return { ok: true };
}

/* ------------------------------------------------------------------ applying */

export async function submitMentorApplication(form: { full_name: string; headline: string; expertise: string[]; experience: string; contact: string }): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return fail("Сессия истекла — войдите снова.");
  const account = await getAccountWithRole(userId);
  if (account.role !== "student") return fail("Ты уже ментор или администратор.");

  const full_name = text(form.full_name, 120);
  const headline = text(form.headline, 160);
  const experience = text(form.experience, 3000);
  if (full_name.length < 2) return fail("Укажи имя и фамилию.");
  if (headline.length < 5) return fail("Коротко опиши, с чем помогаешь (от 5 символов).");
  if (experience.length < 30) return fail("Расскажи об опыте подробнее — хотя бы пару предложений (от 30 символов).");
  const expertise = [...new Set((Array.isArray(form.expertise) ? form.expertise : []).map((e) => text(e, 40)).filter(Boolean))].slice(0, 12);

  const supabase = await createClient();
  const { error } = await supabase
    .from("mentor_applications")
    .insert({ user_id: userId, full_name, headline, expertise, experience, contact: text(form.contact, 200) || null });
  if (error) return fail(error.code === "23505" ? "Заявка уже на рассмотрении." : "Не удалось отправить заявку.");
  revalidatePath("/mentor/apply");
  return { ok: true };
}
