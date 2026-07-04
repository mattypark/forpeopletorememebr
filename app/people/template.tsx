"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Route transition for every dashboard page — a single soft rise on
 * navigation. Compositor-only (opacity/transform), skipped for
 * reduced-motion users.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
