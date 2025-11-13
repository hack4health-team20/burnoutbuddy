"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Practice } from "@/types";
import { Button } from "@/components/ui/button";


interface TimerDisplayProps {
  practice: Practice;
  remaining: number;
  status: "idle" | "running" | "paused" | "completed";
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

const padTime = (value: number) => value.toString().padStart(2, "0");

const buildCuePhases = (practice: Practice) => {
  if (!practice.cue) return [];
  const phases: { label: string; duration: number }[] = [];
  if (practice.cue.inhale) phases.push({ label: "Inhale", duration: practice.cue.inhale });
  if (practice.cue.hold) phases.push({ label: "Hold", duration: practice.cue.hold });
  if (practice.cue.exhale)
    phases.push({ label: "Exhale", duration: practice.cue.exhale });
  if (practice.cue.rest) phases.push({ label: "Rest", duration: practice.cue.rest });
  return phases;
};

export const TimerDisplay = ({ practice, remaining, status, onPause, onResume, onReset }: TimerDisplayProps) => {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const phases = useMemo(() => buildCuePhases(practice), [practice]);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (!phases.length || status !== "running") return;
    const phase = phases[phaseIndex % phases.length];
    const timer = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, phase.duration * 1000);

    return () => clearTimeout(timer);
  }, [phaseIndex, phases, status]);

  const progress = useMemo(() => {
    const total = practice.durationSeconds;
    return 1 - remaining / total;
  }, [practice.durationSeconds, remaining]);

  const activePhase = phases.length && status !== "completed" ? phases[phaseIndex % phases.length] : undefined;

  return (
    <div className="flex flex-col gap-8 rounded-[var(--radius-xl)] border border-white/40 bg-white/80 p-8 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]/70">Timer</span>
        <div className="text-6xl font-semibold text-[var(--text)]">
          {padTime(minutes)}:{padTime(seconds)}
        </div>
        <p className="text-sm text-[var(--muted)]">Stay with the rhythm. You&#39;re creating space to reset.</p>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          transition={{ ease: "easeOut", duration: 0.5 }}
        />
      </div>

      {activePhase && (
        <div className="flex flex-col items-center gap-4">
          <motion.div
            key={activePhase.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]/70">Now</p>
            <p className="text-2xl font-semibold text-[var(--text)]">{activePhase.label}</p>
            <p className="mt-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[var(--muted)]">
              {activePhase.duration} count
            </p>
          </motion.div>
          <motion.div
            animate={{ scale: status === "running" ? [1, 1.04, 1] : 1 }}
            transition={{ repeat: status === "running" ? Infinity : 0, duration: (activePhase.duration ?? 4) / 2 }}
            className="h-24 w-24 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-soft)]/30 shadow-[0_18px_28px_-20px_rgba(95,122,219,0.8)]"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {status === "running" ? (
          <Button variant="secondary" onClick={onPause}>
            Pause
          </Button>
        ) : (
          <Button variant="secondary" onClick={onResume}>
            {status === "completed" ? "Replay" : "Resume"}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            setPhaseIndex(0);
            onReset();
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};
