"use client";

import { useT } from "@/i18n/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { examScoreError, formatScore, nearestScores, type ExamMeta } from "@/lib/exams";
import { cn } from "@/lib/utils";

/**
 * Score field that only accepts what the exam can actually report:
 * digits (plus one decimal separator for IELTS), and a hint with the nearest
 * valid scores when the value falls between steps (SAT 1465 → 1460 / 1470).
 */
export function ExamScoreInput({ id, meta, score, onChange }: { id: string; meta: ExamMeta; score: number; onChange: (score: number) => void }) {
  const t = useT();
  const decimal = meta.step < 1;
  const [raw, setRaw] = useState(Number.isFinite(score) ? formatScore(meta.type, score) : "");
  const [focused, setFocused] = useState(false);

  const parse = (value: string) => (value === "" ? NaN : Number(value.replace(",", ".")));
  const error = raw === "" ? null : examScoreError(meta.type, parse(raw));
  // don't nag while a score is half-typed ("14" on the way to 1450)
  const complete = raw.includes(".") ? raw.split(".")[1] !== "" : raw.length >= String(meta.max).length;
  const showError = error !== null && (complete || !focused);
  const value = parse(raw);
  const suggestions = showError && Number.isFinite(value) ? nearestScores(meta, value).filter((n) => n !== value) : [];

  const set = (value: string) => {
    setRaw(value);
    onChange(parse(value));
  };

  const handleChange = (value: string) => {
    // digits and one "." or "," (one digit after it); a fraction on a whole-point exam stays
    // visible and gets flagged, rather than silently turning "95.5" into 955
    const [whole, ...rest] = value.replace(/[^\d.,]/g, "").split(/[.,]/);
    const clean = rest.length ? `${whole.slice(0, String(meta.max).length)}.${rest.join("").slice(0, 1)}` : whole.slice(0, String(meta.max).length);
    set(clean);
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <Input
        id={id}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        placeholder={t(meta.example)}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
        className={cn("h-10 max-w-28", showError && "border-danger-500 focus:border-danger-500")}
        value={t(raw)}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          // "7" → "7.0" for IELTS, so the stored value always looks like a real score
          const n = parse(raw);
          if (raw !== "" && !examScoreError(meta.type, n)) setRaw(formatScore(meta.type, n));
        }}
      />
      {showError && (
        <div id={`${id}-error`} className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-danger-700" role="alert">
          {/* the buttons already show the nearest scores, so the text only states the rule */}
          <span>{t(suggestions.length ? `${error?.replace(/ — например.*$/, "")}:` : error)}</span>
          {suggestions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set(formatScore(meta.type, n))}
              className="rounded-pill bg-danger-50 px-2 py-0.5 font-semibold text-danger-700 ring-1 ring-danger-500/25 transition hover:bg-danger-500/15"
            >
              {formatScore(meta.type, n)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
