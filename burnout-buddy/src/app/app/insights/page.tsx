"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WeeklyChart } from "@/components/insights/weekly-chart";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/context/app-state-context";
import { PRACTICE_LOOKUP } from "@/content/practices";

export default function InsightsPage() {
  const { data, weeklySummary } = useAppState();

  const totals = useMemo(() => {
    const checkIns = data.checkIns.length;
    const resets = data.resets.length;
    const practiceCounts = data.resets.reduce<Record<string, number>>((acc, reset) => {
      acc[reset.practiceId] = (acc[reset.practiceId] ?? 0) + 1;
      return acc;
    }, {});
    const topPractice = Object.entries(practiceCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      checkIns,
      resets,
      streak: weeklySummary.streak,
      topPracticeName: topPractice ? PRACTICE_LOOKUP[topPractice[0]]?.name : undefined,
      topPracticeCount: topPractice ? topPractice[1] : 0,
    };
  }, [data.checkIns.length, data.resets, weeklySummary.streak]);

  return (
    <AppShell
      title="Weekly Insights"
      description="A gentle glance at how often you&#39;re resetting. Celebrate the streaks and notice the days that might need extra care."
    >
      <WeeklyChart summary={weeklySummary} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Check-ins</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{totals.checkIns}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Micro-moments you honored.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Resets logged</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{totals.resets}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Times you breathed, stretched, or refocused.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Current streak</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{totals.streak} days</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Keep the gentle rhythm going.</p>
        </Card>
      </div>

      {totals.topPracticeName ? (
        <Card className="bg-gradient-to-br from-white/85 to-white/60">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Your go-to reset</p>
          <h3 className="mt-3 text-xl font-semibold text-[var(--text)]">{totals.topPracticeName}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            You&#39;ve leaned on this practice {totals.topPracticeCount} times. Consider noting what you love about
            it to revisit on tougher days.
          </p>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-[var(--muted)]">Once you log a few resets, you&#39;ll see your favourites here.</p>
        </Card>
      )}
    </AppShell>
  );
}
