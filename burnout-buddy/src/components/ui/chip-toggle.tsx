"use client";

import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ChipToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const MotionButton = motion.button;

export const ChipToggle = ({ active, className, children, ...props }: ChipToggleProps) => (
  <MotionButton
    type="button"
    whileTap={{ scale: 0.96 }}
    className={cn(
      "rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-all",
      active
        ? "border-transparent bg-[var(--accent)]/90 text-white"
        : "border-white/60 bg-white/40 text-[var(--muted)] hover:bg-white/70",
      className
    )}
    {...props}
  >
    {children}
  </MotionButton>
);
