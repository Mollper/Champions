import { cn } from "@/lib/utils";

/** Profile photo, or the first letter of the name on a tinted circle. */
export function UserAvatar({ src, name, className }: { src?: string | null; name?: string | null; className?: string }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span className={cn("relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700", className)}>
      {src ? (
        // small, already-resized files from our storage or the sign-in provider: no optimizer needed
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        initial
      )}
    </span>
  );
}
