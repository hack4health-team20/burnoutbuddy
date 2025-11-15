"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateGamificationStories } from "@/lib/gamification";
import { GamificationInput, GamificationStories } from "@/types";

interface AIStoryCardProps {
  payload: GamificationInput;
}

export const AIStoryCard = ({ payload }: AIStoryCardProps) => {
  const [stories, setStories] = useState<GamificationStories | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stablePayload = useMemo(() => JSON.stringify(payload), [payload]);

  const requestStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateGamificationStories(JSON.parse(stablePayload));
      setStories(result);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "We couldn't reach the AI storyteller right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void requestStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stablePayload]);

  return (
    <Card className="flex flex-col gap-6 border border-white/40 bg-white/90 p-5 sm:p-6">
      <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
        <div className="mx-auto rounded-full bg-[var(--accent)]/15 p-2 text-[var(--accent)] sm:mx-0">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">
            AI Encouragement
          </p>
          <h3 className="text-xl font-semibold text-[var(--text)]">Narratives for your journey</h3>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-[var(--radius-sm)] bg-red-50/70 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}

      {!error && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Achievement", value: stories?.achievementStory },
            { label: "Streak", value: stories?.streakCelebration },
            { label: "Progress", value: stories?.progressNarrative },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: stories ? 1 : 0.6, y: 0 }}
              className="rounded-[var(--radius-md)] border border-white/60 bg-white/75 p-4 text-sm text-[var(--muted)] shadow-[var(--shadow-soft)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]/70">
                {item.label}
              </p>
              <p className="mt-2 text-sm text-[var(--text)]">
                {item.value ?? "We’re weaving your story..."}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)] text-center sm:text-left">
          These notes stay on your device. They help remind you why small resets matter.
        </p>
        <Button
          variant="secondary"
          onClick={requestStories}
          disabled={loading}
          className="w-full justify-center sm:w-auto"
        >
          {loading ? "Summoning..." : "Refresh Story"}
        </Button>
      </div>
    </Card>
  );
};

