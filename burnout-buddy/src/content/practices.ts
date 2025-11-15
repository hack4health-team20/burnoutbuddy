import { Practice, MoodValue, TimeAvailable } from "@/types";

export const PRACTICES: Practice[] = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    durationSeconds: 120,
    category: "breathing",
    tags: ["stressed", "exhausted", "ok"],
    summary: "Steady four-count breathing to quickly calm the nervous system.",
    whyItHelps: "Creates rhythmic balance between inhale, hold, exhale and rest to downshift stress hormones.",
    steps: [
      "Inhale gently through the nose for 4 counts.",
      "Hold the breath softly for 4 counts.",
      "Exhale through the mouth for 4 counts.",
      "Rest and notice the pause for 4 counts, then repeat.",
    ],
    cue: { inhale: 4, hold: 4, exhale: 4, rest: 4 },
    timeOptions: ["2m", "5m"],
  },
  {
    id: "478-breathing",
    name: "4-7-8 Breathing",
    durationSeconds: 150,
    category: "breathing",
    tags: ["exhausted", "stressed"],
    summary: "Longer exhales to settle an overactive mind.",
    whyItHelps: "Extending the exhale activates the parasympathetic response and eases tension.",
    steps: [
      "Inhale quietly through the nose for 4 counts.",
      "Hold gently for 7 counts.",
      "Exhale audibly for 8 counts, letting the stress go.",
      "Repeat 4 cycles, keeping shoulders soft.",
    ],
    cue: { inhale: 4, hold: 7, exhale: 8, rest: 0 },
    timeOptions: ["2m"],
  },
  {
    id: "micro-stretch",
    name: "Micro Stretch",
    durationSeconds: 150,
    category: "movement",
    tags: ["ok", "stressed", "exhausted"],
    summary: "Neck and shoulder reset to release screen-time tension.",
    whyItHelps: "Gentle movement boosts blood flow and reduces stiffness that feeds fatigue.",
    steps: [
      "Roll shoulders back in slow circles x3, breathing with the motion.",
      "Drop the right ear toward the shoulder, hold 10 seconds, switch sides.",
      "Interlace fingers behind head, open chest, breathe into the ribs for 3 cycles.",
    ],
    timeOptions: ["2m", "5m"],
  },
  {
    id: "visual-reset",
    name: "Visual Reset",
    durationSeconds: 90,
    category: "visual",
    tags: ["calm", "ok"],
    summary: "Shift focus to distant gaze to relax eye and brain strain.",
    whyItHelps: "Distance gazing relaxes ocular muscles and widens awareness beyond the chart.",
    steps: [
      "Look out to a point 20+ feet away, soften your gaze.",
      "Breathe slowly and notice color, light, and shape.",
      "Blink gently and return with refreshed focus.",
    ],
    timeOptions: ["2m"],
  },
  {
    id: "mental-unload",
    name: "Mental Unload",
    durationSeconds: 120,
    category: "mindset",
    tags: ["stressed", "exhausted"],
    summary: "Slow counting scan to clear looping thoughts.",
    whyItHelps: "Gives the mind a simple rhythmic task so cognitive overload can settle.",
    steps: [
      "Close eyes or soften gaze and count breaths backwards from 10.",
      "If thoughts intrude, warmly notice them and restart at 10.",
      "End by naming one thing you're grateful to have handled today.",
    ],
    timeOptions: ["2m"],
  },
  {
    id: "gratitude-note",
    name: "Gratitude Micro-note",
    durationSeconds: 90,
    category: "gratitude",
    tags: ["calm", "ok", "stressed"],
    summary: "Jot one sentence about someone or something you value from today.",
    whyItHelps: "Gratitude practices increase resilience and buffer against cynicism.",
    steps: [
      "Take three easy breaths, notice what felt meaningful.",
      "Write one sentence or say it aloud.",
      "Let yourself feel the appreciation for a full breath.",
    ],
    timeOptions: ["2m"],
  },
];

export const PRACTICE_LOOKUP: Record<string, Practice> = Object.fromEntries(
  PRACTICES.map((practice) => [practice.id, practice])
);

const moodPriority: Record<MoodValue, string[]> = {
  calm: ["visual-reset", "gratitude-note", "micro-stretch"],
  ok: ["micro-stretch", "gratitude-note", "visual-reset"],
  stressed: ["box-breathing", "micro-stretch", "mental-unload"],
  exhausted: ["478-breathing", "box-breathing", "mental-unload"],
};

export const getPrimaryPracticeForMood = (mood: MoodValue): Practice => {
  const priority = moodPriority[mood][0];
  return PRACTICE_LOOKUP[priority];
};

export const practiceSupportsTime = (practice: Practice, time: TimeAvailable) => {
  if (!practice.timeOptions) return true;
  return practice.timeOptions.includes(time);
};
