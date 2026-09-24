"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ASSISTANT_STYLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { AssistantStyle } from "@/types/models";

/**
 * Persists the preferred assistant style. The profile trigger ignores this column
 * when versioning, so a tone change does not rebuild recommendations or the roadmap.
 */
export async function saveAssistantStyle(style: AssistantStyle): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId || !ASSISTANT_STYLES.some((s) => s.id === style)) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ assistant_style: style }).eq("user_id", userId);
}
// UniRoute · src/app/(app)/assistant-actions.ts
