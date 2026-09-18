"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Palette, X } from "lucide-react";
import { useState } from "react";
import type { Theme } from "@/lib/theme";
import { ThemeControls } from "./theme-controls";

/** A palette button that opens the appearance controls anywhere, even before signing in. */
export function ThemePopover({ initial }: { initial: Theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Оформление"
        title="Оформление"
        className="grid size-9 place-items-center rounded-xl text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
      >
        <Palette className="size-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              className="glass-bar fixed inset-x-3 top-16 z-50 max-h-[80dvh] overflow-y-auto rounded-card border border-line bg-surface p-4 shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[420px]"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Оформление</p>
                <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-canvas" aria-label="Закрыть">
                  <X className="size-4" />
                </button>
              </div>
              <ThemeControls initial={initial} compact />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
