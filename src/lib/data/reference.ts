import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Scholarship, University } from "@/types/models";

/** All universities (reference data, readable by anon). Deduped per request. */
export const getUniversities = cache(async (): Promise<University[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("universities").select("*").order("qs_rank", { nullsFirst: false });
  if (error) throw new Error(`Не удалось загрузить вузы: ${error.message}`);
  return data as University[];
});

export const getScholarships = cache(async (): Promise<Scholarship[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("scholarships").select("*").order("name");
  if (error) throw new Error(`Не удалось загрузить стипендии: ${error.message}`);
  return data as Scholarship[];
});
