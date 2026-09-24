import { cn } from "@/lib/utils";

/**
 * Юни — the UniRoute mascot: an anime boy with a soft, girly look (lavender hair with
 * pink tips, star hair clip, big eyes) in a graduation cap and the brand hoodie.
 * Flat colours only, no gradient ids: several copies render at once (sidebar, header,
 * chat) and hidden duplicates would break referenced <defs>.
 */
export function Mascot({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("block", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}

      {/* hair behind the head */}
      <path d="M21 46C17 66 19 84 29 93h42c10-9 12-27 8-47C75 30 64 23 50 23S25 30 21 46z" fill="#a78bfa" />
      <path d="M24 78c1 7 3 11 6 15h9c-6-4-12-9-15-15zM76 78c-1 7-3 11-6 15h-9c6-4 12-9 15-15z" fill="#f9a8d4" />

      {/* hoodie */}
      <path d="M20 100c2-12 13-19 30-19s28 7 30 19z" fill="#5a36f2" />
      <path d="M33 84c4 5 10 8 17 8s13-3 17-8c-4-2-10-3-17-3s-13 1-17 3z" fill="#7c5cff" />
      <path d="M44 88v8M56 88v8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="44" cy="96.5" r="1.4" fill="#fff" />
      <circle cx="56" cy="96.5" r="1.4" fill="#fff" />

      {/* neck and face */}
      <path d="M44 72h12v10c-3 2-9 2-12 0z" fill="#f4c3ad" />
      <path d="M28 51c0 16 10 26 22 27 12-1 22-11 22-27 0-13-9-21-22-21s-22 8-22 21z" fill="#ffe3d3" />

      {/* eyes: lash line, iris, pupil, highlights */}
      <g>
        <ellipse cx="39.5" cy="57.5" rx="5.6" ry="6.8" fill="#fff" />
        <ellipse cx="39.8" cy="58.3" rx="4.8" ry="6" fill="#6d4dff" />
        <ellipse cx="39.8" cy="61" rx="4" ry="3.2" fill="#9b85ff" />
        <ellipse cx="39.8" cy="58.2" rx="2.4" ry="3.2" fill="#2a1a78" />
        <circle cx="38" cy="55.6" r="1.9" fill="#fff" />
        <circle cx="41.6" cy="61.2" r="0.9" fill="#fff" />
        <path d="M33 54.4C35 50.4 42 49.2 46.3 52.9" fill="none" stroke="#2b1a4d" strokeWidth="2.3" strokeLinecap="round" />
        <path d="M33 54.4l-2-0.4" stroke="#2b1a4d" strokeWidth="1.6" strokeLinecap="round" />

        <ellipse cx="60.5" cy="57.5" rx="5.6" ry="6.8" fill="#fff" />
        <ellipse cx="60.2" cy="58.3" rx="4.8" ry="6" fill="#6d4dff" />
        <ellipse cx="60.2" cy="61" rx="4" ry="3.2" fill="#9b85ff" />
        <ellipse cx="60.2" cy="58.2" rx="2.4" ry="3.2" fill="#2a1a78" />
        <circle cx="58.4" cy="55.6" r="1.9" fill="#fff" />
        <circle cx="62" cy="61.2" r="0.9" fill="#fff" />
        <path d="M67 54.4C65 50.4 58 49.2 53.7 52.9" fill="none" stroke="#2b1a4d" strokeWidth="2.3" strokeLinecap="round" />
        <path d="M67 54.4l2-0.4" stroke="#2b1a4d" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* brows, blush, nose, smile */}
      <path d="M35 46.8q4-2.2 8-0.6M57 46.2q4-1.6 8 0.6" fill="none" stroke="#8b6fd6" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="33.5" cy="65.5" rx="4" ry="2.1" fill="#ff8fb0" opacity="0.55" />
      <ellipse cx="66.5" cy="65.5" rx="4" ry="2.1" fill="#ff8fb0" opacity="0.55" />
      <path d="M49.6 63.4l0.8 0.8" stroke="#e0a48c" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M46.6 68q1.7 1.8 3.4 0.2 1.7 1.6 3.4-0.2" fill="none" stroke="#b0506a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

      {/* bangs and side locks */}
      <path d="M25 54c-3-17 8-29 25-29s28 12 25 29l-4-7-3 5-4-10-4 7-5-10-5 8-5-8-4 10-4-5-3 6-4-5z" fill="#c4b5fd" />
      <path d="M27 45c-5 11-4 25 2 34 1-10 2-19 6-27zM73 45c5 11 4 25-2 34-1-10-2-19-6-27z" fill="#b8a4fb" />
      <path d="M29 79c-1-3-1-6 0-9 1 3 2 6 4 8zM71 79c1-3 1-6 0-9-1 3-2 6-4 8z" fill="#f9a8d4" />
      <path d="M37 32q8-4 17-2" fill="none" stroke="#ede9fe" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

      {/* star hair clip */}
      <path d="M68 39.5l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z" fill="#ffd166" stroke="#f0a20b" strokeWidth="0.6" strokeLinejoin="round" />

      {/* graduation cap with tassel */}
      <g transform="rotate(-8 50 20)">
        <path d="M33 21v7c10 5 24 5 34 0v-7z" fill="#2c2766" />
        <path d="M50 8l31 10-31 10-31-10z" fill="#1f1b4d" />
        <path d="M50 8l31 10-31 10-31-10z" fill="none" stroke="#3b3480" strokeWidth="1" />
        <circle cx="50" cy="18" r="1.8" fill="#ff6a3d" />
        <path d="M50 18l25 3v9" fill="none" stroke="#ff6a3d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M73.2 29.5h3.6l.8 5.5h-5.2z" fill="#ff6a3d" />
      </g>
    </svg>
  );
}

/** Юни cropped to head and shoulders in a soft circle or tile — the face of the AI assistant. */
export function MascotAvatar({ className, rounded = "full" }: { className?: string; rounded?: "full" | "xl" }) {
  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden bg-gradient-to-br from-brand-100 via-[#f1e9ff] to-[#ffe1ef]",
        rounded === "full" ? "rounded-full" : "rounded-xl",
        className,
      )}
      aria-hidden
    >
      <Mascot className="absolute inset-x-0 -bottom-[6%] mx-auto w-[118%] max-w-none -translate-x-[8%]" />
    </span>
  );
}

/** Speech bubble with a spark: the "ask the AI" glyph used next to the mascot. */
export function ChatSparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("block", className)} aria-hidden fill="none">
      <path
        d="M12 3.5c-4.97 0-9 3.47-9 7.75 0 2.3 1.17 4.37 3.03 5.79-.13 1.33-.68 2.6-1.6 3.6 2.07-.1 3.95-.84 5.3-1.98.73.14 1.49.21 2.27.21 4.97 0 9-3.47 9-7.62S16.97 3.5 12 3.5z"
        fill="currentColor"
      />
      <path d="M12 7.2l1.05 2.55 2.55 1.05-2.55 1.05L12 14.4l-1.05-2.55-2.55-1.05 2.55-1.05z" fill="#fff" />
      <circle cx="16.6" cy="7.6" r="0.95" fill="#fff" />
    </svg>
  );
}
