"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { setStepStatus } from "@/app/(app)/roadmap/actions";
import type { RoadmapStep, RoadmapStepStatus } from "@/types/models";

/** Optimistic status updates for roadmap steps. */
export function useSteps(initial: RoadmapStep[]) {
  const router = useRouter();
  const [steps, applyOptimistic] = useOptimistic(initial, (state: RoadmapStep[], update: { id: string; status: RoadmapStepStatus }) =>
    state.map((s) => (s.id === update.id ? { ...s, status: update.status, completed_at: update.status === "done" ? new Date().toISOString() : null } : s)),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const setStatus = (id: string, status: RoadmapStepStatus) => {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ id, status });
      const result = await setStepStatus(id, status);
      if (!result.ok) setError(result.error ?? "Не получилось обновить шаг");
      router.refresh();
    });
  };

  return { steps, setStatus, error };
}
