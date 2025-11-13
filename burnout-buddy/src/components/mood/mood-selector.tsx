"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { MoodValue } from "@/types";
import { cn } from "@/lib/cn";

interface MoodSelectorProps {
  value?: MoodValue;
  onSelect: (value: MoodValue) => void;
}

const MOODS: { value: MoodValue; label: string; emoji: string; tone: string }[] = [
  { value: "calm", label: "Calm", emoji: "🌤️", tone: "from-[#A9D8FF] to-[#E4F3FF]" },
  { value: "ok", label: "OK", emoji: "🙂", tone: "from-[#C5E3FF] to-[#F0F7FF]" },
  { value: "stressed", label: "Stressed", emoji: "😣", tone: "from-[#F9C5BD] to-[#FFE9E4]" },
  { value: "exhausted", label: "Exhausted", emoji: "🥱", tone: "from-[#D4CCFF] to-[#F3F0FF]" },
];

export const MoodSelector = ({ value, onSelect }: MoodSelectorProps) => {
  const selectedMood = useMemo(() => value, [value]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {MOODS.map((mood) => {
        const isActive = selectedMood === mood.value;
        return (
          <motion.button
            key={mood.value}
            type="button"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-[24px] border border-white/50 bg-white/60 p-4 text-center shadow-sm transition focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]",
              isActive &&
                cn(
                  "border-transparent text-white shadow-[0_20px_35px_-28px_rgba(61,92,219,0.7)]",
                  "bg-gradient-to-br",
                  mood.tone
                )
            )}
            onClick={() => onSelect(mood.value)}
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span className={cn("text-sm font-medium", isActive ? "text-white" : "text-[var(--muted)]")}
            >
              {mood.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
