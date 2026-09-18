import { cn } from "@/lib/utils";

/**
 * Generic skeleton shown the instant a link is clicked, while the destination page's data is
 * still loading. Its real job isn't the shape — it's existing at all: a `loading.tsx` file is
 * what lets Next.js prefetch a dynamic route's shell ahead of the click, which is what actually
 * makes the navigation feel instant instead of frozen.
 */
export function RouteLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="container-page space-y-5 py-6 sm:py-10" aria-hidden>
      <div className="space-y-2">
        <div className="h-3.5 w-24 animate-pulse rounded-full bg-line" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded-full bg-line" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-line/70" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-card border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}

/** Same idea, sized for a page that's mostly one wide panel (chat, editor). */
export function PanelLoading({ className }: { className?: string }) {
  return (
    <div className={cn("container-page space-y-5 py-6 sm:py-10", className)} aria-hidden>
      <div className="space-y-2">
        <div className="h-3.5 w-24 animate-pulse rounded-full bg-line" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded-full bg-line" />
      </div>
      <div className="h-[60dvh] animate-pulse rounded-card border border-line bg-surface" />
    </div>
  );
}
