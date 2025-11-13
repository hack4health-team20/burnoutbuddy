"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChipToggle } from "@/components/ui/chip-toggle";
import { MoodSelector } from "@/components/mood/mood-selector";
import { useAppState } from "@/context/app-state-context";

export default function HomePage() {
  const router = useRouter();
  const { moodForm, updateMoodForm, commitMoodSelection, weeklySummary } = useAppState();

  const handleGetReset = () => {
    const recommendation = commitMoodSelection();
    if (recommendation) {
      router.push("/app/recommendation");
    }
  };

  const latestCheckIn = weeklySummary.points
    .slice()
    .reverse()
    .find((point) => point.checkIns > 0);

  return (
    <AppShell
      title="How are you arriving today?"
      description="Choose the mood that fits right now. We'll line up a micro-reset that matches your energy and time."
    >
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">How are you feeling right now?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              One tap. No judgement. The more you check in, the better your resets adapt to you.
            </p>
          </div>

          <MoodSelector value={moodForm.mood} onSelect={(value) => updateMoodForm({ mood: value })} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-white/40 bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">On shift?</p>
              <div className="mt-3 flex gap-3">
                <ChipToggle
                  active={moodForm.shift}
                  onClick={() => updateMoodForm({ shift: true })}
                >
                  Yes
                </ChipToggle>
                <ChipToggle
                  active={!moodForm.shift}
                  onClick={() => updateMoodForm({ shift: false })}
                >
                  Not right now
                </ChipToggle>
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-white/40 bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Time available</p>
              <div className="mt-3 flex gap-3">
                <ChipToggle
                  active={moodForm.timeAvailable === "2m"}
                  onClick={() => updateMoodForm({ timeAvailable: "2m" })}
                >
                  About 2 minutes
                </ChipToggle>
                <ChipToggle
                  active={moodForm.timeAvailable === "5m"}
                  onClick={() => updateMoodForm({ timeAvailable: "5m" })}
                >
                  About 5 minutes
                </ChipToggle>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sm text-[var(--muted)]">
                Micro-resets keep you steady. Try a daily check-in streak—it takes less than a sip of
                water.
              </p>
            </motion.div>
            <Button size="lg" disabled={!moodForm.mood} onClick={handleGetReset}>
              Get a Reset
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">This week</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--muted)]">
              <div className="flex items-center justify-between">
                <span>Check-ins</span>
                <span className="text-lg font-semibold text-[var(--text)]">
                  {weeklySummary.points.reduce((acc, point) => acc + point.checkIns, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Micro-resets logged</span>
                <span className="text-lg font-semibold text-[var(--text)]">
                  {weeklySummary.points.reduce((acc, point) => acc + point.resets, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Current streak</span>
                <span className="text-lg font-semibold text-[var(--text)]">{weeklySummary.streak} days</span>
              </div>
            </div>
          </Card>

          {latestCheckIn ? (
            <Card className="bg-gradient-to-br from-white/80 to-white/60">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Latest win</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                You checked in on {latestCheckIn.label}. Keep the momentum—your future self thanks you.
              </p>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-[var(--muted)]">Your first check-in will appear here. Ready?</p>
            </Card>
          )}
        </div>
      </section>
    </AppShell>
  );
}
