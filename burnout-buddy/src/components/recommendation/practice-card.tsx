"use client";

import { motion } from "framer-motion";
import { Practice } from "@/types";

interface PracticeCardProps {
  practice: Practice;
  reason: string;
}

const categoryCopy: Record<Practice["category"], string> = {
  breathing: "Breathing",
  movement: "Micro-movement",
  mindset: "Mindset",
  visual: "Visual reset",
  gratitude: "Gratitude",
};

export const PracticeCard = ({ practice, reason }: PracticeCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="rounded-[var(--radius-lg)] border border-white/30 bg-white/75 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl"
  >
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Suggested Reset</p>
        <h2 className="text-2xl font-semibold text-[var(--text)]">{practice.name}</h2>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
          {categoryCopy[practice.category]}
        </span>
        <span className="rounded-full bg-white/50 px-3 py-1 shadow-sm">
          {Math.round(practice.durationSeconds / 60)} min
        </span>
      </div>
    </div>

    <p className="mt-4 text-sm text-[var(--muted)]/90">{reason}</p>

    {practice.steps.length > 0 && (
      <ol className="mt-5 space-y-3 text-[var(--muted)]">
        {practice.steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-[var(--accent)] shadow-sm">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    )}

    {practice.cue && (
      <div className="mt-6 rounded-[var(--radius-md)] border border-white/30 bg-white/60 p-4 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">Breathing Cue</p>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs uppercase tracking-[0.2em] text-[var(--muted)]/80">
          <div className="rounded-full bg-white/80 px-4 py-2 shadow-sm">
            Inhale
            <div className="text-lg font-semibold text-[var(--text)]">{practice.cue.inhale ?? "-"}</div>
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2 shadow-sm">
            Hold
            <div className="text-lg font-semibold text-[var(--text)]">{practice.cue.hold ?? "-"}</div>
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2 shadow-sm">
            Exhale
            <div className="text-lg font-semibold text-[var(--text)]">{practice.cue.exhale ?? "-"}</div>
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2 shadow-sm">
            Rest
            <div className="text-lg font-semibold text-[var(--text)]">{practice.cue.rest ?? "-"}</div>
          </div>
        </div>
      </div>
    )}
  </motion.div>
);
