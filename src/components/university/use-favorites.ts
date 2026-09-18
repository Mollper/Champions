"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleFavorite } from "@/app/(app)/favorites/actions";

/** Optimistic favorites: the heart fills at once, and rolls back if saving fails. */
export function useFavorites(initialIds: number[]) {
  const [saved, setSaved] = useState(initialIds);
  const [ids, setIds] = useOptimistic(saved);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggle = (universityId: number) => {
    const add = !ids.includes(universityId);
    setError(null);
    startTransition(async () => {
      const next = add ? [...ids, universityId] : ids.filter((id) => id !== universityId);
      setIds(next);
      const result = await toggleFavorite(universityId, add);
      if (result.ok) setSaved(next);
      else setError(result.error ?? "Не получилось");
    });
  };

  return { ids, toggle, error };
}
