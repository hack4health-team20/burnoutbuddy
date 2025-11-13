"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRACTICES } from "@/content/practices";
import { useAppState } from "@/context/app-state-context";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const { startTimerForPractice, moodForm } = useAppState();
  const router = useRouter();

  return (
    <AppShell
      title="Micro-reset Library"
      description="Every practice is short, evidence-informed, and friendly to busy shifts. Bookmark the ones that resonate."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {PRACTICES.map((practice) => (
          <Card key={practice.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">
                  {practice.category}
                </p>
                <h3 className="text-xl font-semibold text-[var(--text)]">{practice.name}</h3>
              </div>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-[var(--muted)]">
                {Math.round(practice.durationSeconds / 60)} min
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">{practice.summary}</p>
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <p className="font-medium text-[var(--text)]">How it helps</p>
              <p>{practice.whyItHelps}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Steps</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                {practice.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                moodForm.mood ? startTimerForPractice(practice) : router.push("/app/home")
              }
            >
              {moodForm.mood ? "Start this reset" : "Check in to start"}
            </Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
