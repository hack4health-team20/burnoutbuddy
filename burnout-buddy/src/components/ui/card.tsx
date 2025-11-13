import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-[var(--radius-lg)] border border-white/40 bg-white/70 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl",
      className
    )}
    {...props}
  />
);
