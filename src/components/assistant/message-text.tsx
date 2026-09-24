import Link from "next/link";
import { Fragment } from "react";

/** Renders the tiny markdown subset the assistant uses: **bold**, [link](/path), "- " and "1. " lists. */
export function MessageText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^(- |\d+\. |→ )/.test(l));
        if (isList) {
          const ordered = /^\d+\. /.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag key={bi} className="space-y-1">
              {lines.map((l, li) => {
                const content = l.replace(/^(- |\d+\. )/, "");
                const marker = l.startsWith("→ ") ? null : ordered ? `${li + 1}.` : "•";
                return (
                  <li key={li} className="flex gap-2">
                    {marker && <span className="shrink-0 font-semibold text-brand-600">{marker}</span>}
                    <span className="min-w-0">
                      <Inline text={content} />
                    </span>
                  </li>
                );
              })}
            </Tag>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                <Inline text={l} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <b key={i} className="font-semibold text-ink">{bold[1]}</b>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const href = link[2];
          return href.startsWith("/") ? (
            <Link key={i} href={href} className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-600">
              {link[1]}
            </Link>
          ) : (
            <span key={i}>{link[1]}</span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
