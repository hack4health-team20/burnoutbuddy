import { PRACTICES, PRACTICE_LOOKUP, practiceSupportsTime } from "@/content/practices";
import { MoodValue, RecommendationResult, TimeAvailable, BurnoutData } from "@/types";
import { getMLRecommendations } from "./ml-recommendation";

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
  onShift: boolean,
  historicalData?: BurnoutData
): RecommendationResult => {
  
  let rankedPractices: typeof PRACTICES = [];
  
  // If we have historical data, use ML to rank practices
  if (historicalData) {
    rankedPractices = getMLRecommendations(mood, timeAvailable, onShift, PRACTICES, historicalData);
  } else {
    // Fallback to original logic if no historical data
    rankedPractices = PRACTICES.filter(
      (practice) => practice.tags.includes(mood) && practiceSupportsTime(practice, timeAvailable)
    );
  }

  // If no matching practices found, use fallback
  if (!rankedPractices.length) {
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

  const primary = rankedPractices[0];
  const alternatives = rankedPractices.slice(1);

  const reasonParts = [
    `You selected ${formatMood(mood).toLowerCase()} with about ${timeCopy[timeAvailable]}.`,
    primary.whyItHelps,
  ];

  if (onShift) {
    reasonParts.unshift("You're on shift, so we picked something you can do between patients.");
  }

  // If we have historical data, add a personalized note
  if (historicalData) {
    reasonParts.unshift(`Based on your patterns, this practice often helps when you're feeling ${formatMood(mood).toLowerCase()}.`);
  }

  return {
    primary,
    alternatives: alternatives.filter((practice) => practice.id !== primary.id).slice(0, 2),
    reason: reasonParts.join(" "),
  };
};

export const getPracticeById = (id: string) => PRACTICE_LOOKUP[id];
