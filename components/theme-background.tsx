"use client";

import { motion } from "framer-motion";

export function ThemeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-muted to-black" />
      <motion.div
        className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[120px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.9, 0.6],
          rotate: [0, 10, -5, 0]
        }}
        transition={{
          duration: 22,
          repeat: Infinity
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/25 blur-[100px]"
        animate={{
          scale: [1, 1.2, 0.95, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 18,
          repeat: Infinity
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),_transparent_45%)]" />
    </div>
  );
}
