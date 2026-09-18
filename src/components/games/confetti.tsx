"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const COLORS = ["#8b6fff", "#2fd1b7", "#ff875f", "#ffd166", "#f472b6", "#60a5fa"];

/** A burst of confetti from the top centre: pieces fly out, spin and fall. */
export function Confetti({ pieces = 90 }: { pieces?: number }) {
  // random once per burst; the parent remounts it (key) to fire again
  const [bits] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      x: (Math.random() - 0.5) * 900,
      y: 300 + Math.random() * 500,
      rotate: (Math.random() - 0.5) * 900,
      delay: Math.random() * 0.25,
      size: 6 + Math.random() * 7,
      round: Math.random() > 0.6,
    })),
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-1/4 z-[80] flex justify-center">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute block"
          style={{ width: b.size, height: b.round ? b.size : b.size * 0.45, background: b.color, borderRadius: b.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, -220 - Math.abs(b.x) * 0.2, b.y], opacity: [1, 1, 0], rotate: b.rotate }}
          transition={{ duration: 2.2, delay: b.delay, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
