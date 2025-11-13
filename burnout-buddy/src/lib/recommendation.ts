import { PRACTICES, PRACTICE_LOOKUP, practiceSupportsTime } from "@/content/practices";
import { MoodValue, RecommendationResult, TimeAvailable } from "@/types";

const timeCopy: Record<TimeAvailable, string> = {
  "2m": "2 minutes",
  "5m": "5 minutes",
};

export const formatMood = (mood: MoodValue) => {
  switch (mood) {
    case "calm":
      return "Calm";
    case "ok":
      return "OK";
    case "stressed":
      return "Stressed";
    case "exhausted":
      return "Exhausted";
    default:
      return mood;
  }
};

export const buildRecommendation = (
  mood: MoodValue,
  timeAvailable: TimeAvailable,
  onShift: boolean
): RecommendationResult => {
  const matched = PRACTICES.filter(
    (practice) => practice.tags.includes(mood) && practiceSupportsTime(practice, timeAvailable)
  );

  if (!matched.length) {
    const fallback = PRACTICES.find((practice) => practiceSupportsTime(practice, timeAvailable));
    if (!fallback) {
      throw new Error("No practices available for the selected filters.");
    }

    return {
      primary: fallback,
      alternatives: PRACTICES.filter((p) => p.id !== fallback.id).slice(0, 2),
      reason: `A versatile reset that fits into your ${timeCopy[timeAvailable]} window.`,
    };
  }

  const primary = matched[0];
  const alternatives = matched.slice(1).concat(
    PRACTICES.filter((practice) => !matched.includes(practice) && practiceSupportsTime(practice, timeAvailable))
  );

  const reasonParts = [
    `You selected ${formatMood(mood).toLowerCase()} with about ${timeCopy[timeAvailable]}.`,
    primary.whyItHelps,
  ];

  if (onShift) {
    reasonParts.unshift("You're on shift, so we picked something you can do between patients.");
  }

  return {
    primary,
    alternatives: alternatives.filter((practice) => practice.id !== primary.id).slice(0, 2),
    reason: reasonParts.join(" "),
  };
};

export const getPracticeById = (id: string) => PRACTICE_LOOKUP[id];
