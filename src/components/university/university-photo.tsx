import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  credit?: string | null;
  sourceUrl?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  eager?: boolean;
  showCredit?: boolean;
};

/** Campus photo from Wikimedia Commons with the attribution its license requires. */
export function UniversityPhoto({
  src,
  alt,
  credit,
  sourceUrl,
  className,
  sizes = "(max-width: 640px) 100vw, 400px",
  priority,
  eager,
  showCredit = true,
}: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-line", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} loading={eager ? "eager" : undefined} className="object-cover" />
      {showCredit && credit && (
        <a
          href={sourceUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-1.5 right-1.5 max-w-[85%] truncate rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] leading-tight text-white/90 backdrop-blur-sm hover:bg-black/60"
          title={`Фото: ${credit}`}
        >
          Фото: {credit}
        </a>
      )}
    </div>
  );
}
