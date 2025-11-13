"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TimerDisplay } from "@/components/timer/timer-display";
import { Button } from "@/components/ui/button";
import { ChipToggle } from "@/components/ui/chip-toggle";
import { useAppState } from "@/context/app-state-context";
import { useCountdown } from "@/hooks/use-countdown";
import { PostMood } from "@/types";

export default function TimerPage() {
  const { timerSession, completeTimer, skipTimer } = useAppState();
  const router = useRouter();
  const [postMood, setPostMood] = useState<PostMood | undefined>(undefined);

  useEffect(() => {
    if (!timerSession) {
      router.replace("/app/home");
    }
  }, [timerSession, router]);

  const countdown = useCountdown(timerSession?.durationSeconds ?? 0, {
    autostart: Boolean(timerSession),
    onComplete: () => {
      if (timerSession) {
        setPostMood((prev) => prev ?? "better");
      }
    },
  });

  if (!timerSession) {
    return null;
  }

  const handleReset = () => {
    setPostMood(undefined);
    countdown.reset();
  };

  const handleLog = () => {
    completeTimer({ logReset: true, postMood: postMood ?? "same" });
  };

  return (
    <AppShell
      title={timerSession.practice.name}
      description="Settle in and follow the cue. When you finish, log it to keep your streak alive."
    >
      <TimerDisplay
        key={timerSession.id}
        practice={timerSession.practice}
        remaining={countdown.remaining}
        status={countdown.status}
        onPause={countdown.pause}
        onResume={countdown.resume}
        onReset={handleReset}
      />

      {countdown.status === "completed" && (
        <div className="rounded-[var(--radius-lg)] border border-white/40 bg-white/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <h3 className="text-2xl font-semibold text-[var(--text)]">Nice work! Log this reset?</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            A quick check keeps your personal trendline accurate. Did this reset help?
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ChipToggle active={postMood === "better"} onClick={() => setPostMood("better")}>
              I feel better
            </ChipToggle>
            <ChipToggle active={postMood === "same"} onClick={() => setPostMood("same")}>
              Not yet
            </ChipToggle>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={handleLog}>Log this reset</Button>
            <Button variant="ghost" onClick={() => skipTimer()}>
              Skip
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
