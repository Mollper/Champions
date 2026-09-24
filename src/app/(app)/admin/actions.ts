"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { getAccountWithRole, type Role } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminResult = { ok: true } | { ok: false; error: string };

/** Every admin action re-checks the caller's role on the server and then uses the service role. */
async function adminContext() {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Сессия истекла — войдите снова." } as const;
  const account = await getAccountWithRole(userId);
  if (account.role !== "admin") return { error: "Нужны права администратора." } as const;
  const admin = createAdminClient();
  if (!admin) return { error: "На сервере нет SUPABASE_SECRET_KEY." } as const;
  return { userId, admin } as const;
}

export async function reviewApplication(applicationId: number, approve: boolean, note: string): Promise<AdminResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error! };
  const { admin, userId } = ctx;

  const { data: app } = await admin.from("mentor_applications").select("*").eq("id", applicationId).maybeSingle();
  if (!app || app.status !== "pending") return { ok: false, error: "Заявка уже рассмотрена." };

  const { error } = await admin
    .from("mentor_applications")
    .update({ status: approve ? "approved" : "rejected", admin_note: note.trim().slice(0, 1000) || null, reviewed_by: userId, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (error) return { ok: false, error: "Не удалось сохранить решение." };

  if (approve) {
    // the student becomes a mentor with a card built from the application
    await admin.from("users").update({ role: "mentor" }).eq("id", app.user_id).eq("role", "student");
    await admin.from("mentor_profiles").upsert({
      user_id: app.user_id,
      display_name: app.full_name,
      headline: app.headline,
      bio: app.experience,
      expertise: app.expertise,
      accepting: true,
    });
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setUserRole(targetId: string, role: Role): Promise<AdminResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error! };
  if (!["student", "mentor", "admin"].includes(role)) return { ok: false, error: "Неизвестная роль." };
  if (targetId === ctx.userId && role !== "admin") return { ok: false, error: "Нельзя снять с себя права администратора." };

  const { admin } = ctx;
  const { data: user } = await admin.from("users").select("full_name, email").eq("id", targetId).maybeSingle();
  if (!user) return { ok: false, error: "Пользователь не найден." };
  const { error } = await admin.from("users").update({ role }).eq("id", targetId);
  if (error) return { ok: false, error: "Не удалось сменить роль." };

  if (role === "mentor") {
    // a mentor needs a card for students to find them
    await admin
      .from("mentor_profiles")
      .upsert({ user_id: targetId, display_name: user.full_name || user.email || "Ментор", headline: "Ментор UniRoute", accepting: true }, { onConflict: "user_id", ignoreDuplicates: true });
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function endMentorshipAsAdmin(mentorId: string, studentId: string): Promise<AdminResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return { ok: false, error: ctx.error! };
  const { error } = await ctx.admin.from("mentorships").update({ status: "ended" }).eq("mentor_id", mentorId).eq("student_id", studentId);
  if (error) return { ok: false, error: "Не удалось завершить наставничество." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
