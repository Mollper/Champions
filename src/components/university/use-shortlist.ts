"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toggleShortlist } from "@/app/(app)/recommendations/actions";

/** Optimistic shortlist toggling shared by recommendations and compare pages. */
export function useShortlist(initialIds: number[]) {
  const router = useRouter();
  const [ids, setIds] = useOptimistic(initialIds);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggle = (universityId: number) => {
    const add = !ids.includes(universityId);
    setError(null);
    setPendingId(universityId);
    startTransition(async () => {
      setIds(add ? [...ids, universityId] : ids.filter((id) => id !== universityId));
      const result = await toggleShortlist(universityId, add);
      if (!result.ok) setError(result.error ?? "Не получилось");
      setPendingId(null);
      router.refresh();
    });
  };

  return { ids, toggle, pendingId, error };
}
// UniRoute · src/components/university/use-shortlist.ts
