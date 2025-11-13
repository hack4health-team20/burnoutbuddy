"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const MotionButton = motion.button;

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-[var(--shadow-floating)] hover:bg-[var(--accent-strong)]",
  secondary:
    "bg-white/70 text-[var(--text)] border border-white/60 backdrop-blur hover:bg-white",
  ghost:
    "bg-transparent text-[var(--muted)] hover:bg-white/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  subtleHover?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", subtleHover = false, disabled, ...props }, ref) => {
    return (
      <MotionButton
        ref={ref}
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        whileHover={disabled ? undefined : { scale: subtleHover ? 1.01 : 1.02 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
