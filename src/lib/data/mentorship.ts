import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type MentorCard = Tables<"mentor_profiles">;
export type Mentorship = Tables<"mentorships">;
export type ChatMessage = Pick<Tables<"mentor_messages">, "id" | "sender_id" | "body" | "created_at" | "read_at">;
export type MentorApplication = Tables<"mentor_applications">;

/** Approved mentors students can choose from. */
export const listMentors = cache(async (): Promise<MentorCard[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("mentor_profiles").select("*").order("created_at");
  return data ?? [];
});

/** The student's open request or active mentorship, with the mentor's card. */
export const getStudentMentorship = cache(async (studentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentorships")
    .select("*")
    .eq("student_id", studentId)
    .in("status", ["pending", "active"])
    .maybeSingle();
  if (!data) return null;
  const { data: card } = await supabase.from("mentor_profiles").select("*").eq("user_id", data.mentor_id).maybeSingle();
  return { mentorship: data, mentor: card };
});

export type StudentRow = {
  mentorship: Mentorship;
  student: { id: string; email: string | null; full_name: string | null };
  profile: { completed_at: string | null; grade: number | null; interests: string[]; target_countries: string[] } | null;
  steps: { total: number; done: number };
  unread: number;
};

/** A mentor's requests and students, with the numbers shown on their dashboard. */
export const getMentorStudents = cache(async (mentorId: string): Promise<StudentRow[]> => {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("mentorships").select("*").eq("mentor_id", mentorId).in("status", ["pending", "active"]).order("created_at");
  if (!rows?.length) return [];
  const ids = rows.map((r) => r.student_id);
  // Only active students' data is visible to the mentor (RLS); pending requests show the name only.
  const [{ data: users }, { data: profiles }, { data: steps }, { data: unread }] = await Promise.all([
    supabase.from("users").select("id, email, full_name").in("id", ids),
    supabase.from("profiles").select("user_id, completed_at, grade, interests, target_countries").in("user_id", ids),
    supabase.from("roadmap_steps").select("user_id, status").in("user_id", ids),
    supabase.from("mentor_messages").select("student_id").eq("mentor_id", mentorId).neq("sender_id", mentorId).is("read_at", null),
  ]);
  return rows.map((m) => {
    const own = (steps ?? []).filter((s) => s.user_id === m.student_id);
    return {
      mentorship: m,
      student: users?.find((u) => u.id === m.student_id) ?? { id: m.student_id, email: null, full_name: null },
      profile: profiles?.find((p) => p.user_id === m.student_id) ?? null,
      steps: { total: own.length, done: own.filter((s) => s.status === "done").length },
      unread: (unread ?? []).filter((u) => u.student_id === m.student_id).length,
    };
  });
});

export async function getThread(mentorId: string, studentId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentor_messages")
    .select("id, sender_id, body, created_at, read_at")
    .eq("mentor_id", mentorId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).reverse();
}

export const getMyApplications = cache(async (userId: string): Promise<MentorApplication[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("mentor_applications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
});
// UniRoute · src/lib/data/mentorship.ts
