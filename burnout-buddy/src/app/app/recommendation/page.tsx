"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PracticeCard } from "@/components/recommendation/practice-card";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/context/app-state-context";

export default function RecommendationPage() {
  const { recommendation, rotateRecommendation, startTimerForPractice } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!recommendation) {
      router.replace("/app/home");
    }
  }, [recommendation, router]);

  if (!recommendation) {
    return null;
  }

  return (
    <AppShell
      title="Suggested Reset"
      description="Here's a micro-practice tuned to your mood and time. Stay curious—try alternates if you want something different."
    >
      <PracticeCard practice={recommendation.primary} reason={recommendation.reason} />

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => startTimerForPractice(recommendation.primary)}>
          Start Timer
        </Button>
        <Button variant="secondary" onClick={() => rotateRecommendation()}>
          Try another
        </Button>
        <Button variant="ghost" onClick={() => router.push("/app/home")}
        >
          Back
        </Button>
      </div>

      {recommendation.alternatives.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {recommendation.alternatives.map((practice) => (
            <Card key={practice.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Alternate</p>
                  <h3 className="text-lg font-semibold text-[var(--text)]">{practice.name}</h3>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-[var(--muted)]">
                  {Math.round(practice.durationSeconds / 60)} min
                </span>
              </div>
              <p className="text-sm text-[var(--muted)]">{practice.summary}</p>
              <Button
                variant="ghost"
                className="mt-auto self-start"
                onClick={() => startTimerForPractice(practice)}
              >
                Use this reset
              </Button>
            </Card>
          ))}
        </section>
      )}
    </AppShell>
  );
}
