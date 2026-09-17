"use client";

import { motion, stagger, type Variants } from "framer-motion";
import type { ComponentProps } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = ComponentProps<typeof motion.div> & { delay?: number; y?: number };

/** Fades + slides content in the first time it scrolls into view. */
export function Reveal({ delay = 0, y = 24, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const group: Variants = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.09) } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Parent that staggers its <StaggerItem> children into view. */
export function Stagger({ children, ...rest }: ComponentProps<typeof motion.div>) {
  return (
    <motion.div variants={group} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} {...rest}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...rest }: ComponentProps<typeof motion.div>) {
  return (
    <motion.div variants={item} {...rest}>
      {children}
    </motion.div>
  );
}
