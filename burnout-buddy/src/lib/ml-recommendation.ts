import { MoodValue, TimeAvailable, Practice, BurnoutData, ResetLog, MoodCheckIn } from "@/types";

// Define the ML model for personalized recommendations
interface PracticeEffectiveness {
  practiceId: string;
  mood: MoodValue;
  effectivenessScore: number; // 0.0 to 1.0
  usageCount: number;
  positiveOutcomeCount: number;
  timePreference?: TimeAvailable; // Preferred time for this practice
}

interface UserPattern {
  avgMoodImprovement: number; // Average improvement (0.0 to 1.0)
  preferredPractices: string[]; // Most effective practices
  timeOfDayPatterns: Record<string, number>; // Effectiveness by time of day
  dayOfWeekPatterns: Record<string, number>; // Effectiveness by day of week
}

// Calculate hour of day from ISO timestamp
const getHour = (timestamp: string): number => {
  return new Date(timestamp).getHours();
};

// Calculate day of week from ISO timestamp (0=Sunday, 6=Saturday)
const getDayOfWeek = (timestamp: string): number => {
  return new Date(timestamp).getDay();
};

// Calculate mood improvement based on pre/post mood
const calculateMoodImprovement = (preMood: MoodValue, postMood: "better" | "same" | undefined): number => {
  if (!postMood) return 0.5; // Default to neutral if no feedback
  return postMood === "better" ? 1.0 : 0.0; // Better = 1.0, Same = 0.0
};

// Get mood value as a number (calm=4, ok=3, stressed=2, exhausted=1)
const getMoodValue = (mood: MoodValue): number => {
  switch (mood) {
    case "calm": return 4;
    case "ok": return 3;
    case "stressed": return 2;
    case "exhausted": return 1;
    default: return 2.5;
  }
};

// Analyze historical data to build user patterns
const analyzeUserPatterns = (checkIns: MoodCheckIn[], resets: ResetLog[]): UserPattern => {
  const timeOfDayPatterns: Record<string, number> = {};
  const dayOfWeekPatterns: Record<string, number> = {};
  let totalImprovement = 0;
  let improvementCount = 0;
  const practiceEffectiveness: Record<string, { total: number, count: number }> = {};
  const practiceMap: Record<string, number> = {};

  // Process all resets to determine effectiveness
  resets.forEach(reset => {
    const checkIn = checkIns.find(ci => ci.practiceId === reset.practiceId);
    if (checkIn) {
      const improvement = calculateMoodImprovement(checkIn.mood, reset.postMood);
      totalImprovement += improvement;
      improvementCount += 1;

      // Track time of day and day of week patterns
      const hour = getHour(reset.startedAt);
      const day = getDayOfWeek(reset.startedAt);
      
      timeOfDayPatterns[hour] = (timeOfDayPatterns[hour] || 0) + improvement;
      dayOfWeekPatterns[day] = (dayOfWeekPatterns[day] || 0) + improvement;

      // Track practice effectiveness
      if (!practiceEffectiveness[reset.practiceId]) {
        practiceEffectiveness[reset.practiceId] = { total: 0, count: 0 };
      }
      practiceEffectiveness[reset.practiceId].total += improvement;
      practiceEffectiveness[reset.practiceId].count += 1;
    }
  });

  // Calculate average mood improvement
  const avgMoodImprovement = improvementCount > 0 ? totalImprovement / improvementCount : 0.5;

  // Find most effective practices
  const preferredPractices = Object.entries(practiceEffectiveness)
    .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
    .slice(0, 5) // Top 5 practices
    .map(([practiceId]) => practiceId);

  // Normalize time of day patterns
  Object.keys(timeOfDayPatterns).forEach(hour => {
    timeOfDayPatterns[hour] = timeOfDayPatterns[hour] / (resets.filter(r => getHour(r.startedAt) === parseInt(hour)).length || 1);
  });

  // Normalize day of week patterns
  Object.keys(dayOfWeekPatterns).forEach(day => {
    dayOfWeekPatterns[day] = dayOfWeekPatterns[day] / (resets.filter(r => getDayOfWeek(r.startedAt) === parseInt(day)).length || 1);
  });

  return {
    avgMoodImprovement,
    preferredPractices,
    timeOfDayPatterns,
    dayOfWeekPatterns
  };
};

// Calculate effectiveness score for a practice based on user patterns
const calculatePracticeScore = (
  practice: Practice,
  mood: MoodValue,
  timeAvailable: TimeAvailable,
  userPatterns: UserPattern,
  historicalEffectiveness: PracticeEffectiveness[],
  currentHour: number
): number => {
  let baseScore = 0.5; // Default neutral score

  // Factor 1: Historical effectiveness for this specific user and mood
  const userMoodEffectiveness = historicalEffectiveness
    .filter(e => e.practiceId === practice.id && e.mood === mood)
    .reduce((sum, e) => sum + e.effectivenessScore, 0);
  
  baseScore += userMoodEffectiveness * 0.3; // Weight: 30%

  // Factor 2: Time of day pattern matching
  const timeOfDayScore = userPatterns.timeOfDayPatterns[currentHour] || 0.5;
  baseScore += (timeOfDayScore - 0.5) * 0.1; // Weight: 10%

  // Factor 3: User's preferred practices
  if (userPatterns.preferredPractices.includes(practice.id)) {
    baseScore += 0.15; // Weight: 15% bonus
  }

  // Factor 4: Practice category alignment with mood
  // Different categories work better for different mood states
  if (mood === "exhausted" || mood === "stressed") {
    if (practice.category === "breathing" || practice.category === "mindset") {
      baseScore += 0.1; // Breathing/mindset more effective for stress
    }
  } else if (mood === "calm" || mood === "ok") {
    if (practice.category === "visual" || practice.category === "gratitude") {
      baseScore += 0.1; // Visual/gratitude for maintenance
    }
  }

  // Factor 5: Time matching
  if (timeAvailable === "2m" && practice.durationSeconds <= 180) {
    baseScore += 0.05; // Small bonus for matching time
  } else if (timeAvailable === "5m" && practice.durationSeconds > 180) {
    baseScore += 0.05; // Small bonus for matching time
  }

  // Ensure the score stays within bounds
  return Math.max(0, Math.min(1, baseScore));
};

// Build practice effectiveness data from historical data
const buildPracticeEffectiveness = (checkIns: MoodCheckIn[], resets: ResetLog[]): PracticeEffectiveness[] => {
  const effectivenessMap: Record<string, Record<MoodValue, { total: number, count: number }>> = {};

  // Build effectiveness map from resets
  resets.forEach(reset => {
    const checkIn = checkIns.find(ci => ci.practiceId === reset.practiceId);
    if (checkIn) {
      const practiceId = reset.practiceId;
      const mood = checkIn.mood;
      const improvement = calculateMoodImprovement(mood, reset.postMood);

      if (!effectivenessMap[practiceId]) {
        effectivenessMap[practiceId] = {
          calm: { total: 0, count: 0 },
          ok: { total: 0, count: 0 },
          stressed: { total: 0, count: 0 },
          exhausted: { total: 0, count: 0 }
        };
      }

      effectivenessMap[practiceId][mood].total += improvement;
      effectivenessMap[practiceId][mood].count += 1;
    }
  });

  // Convert to PracticeEffectiveness array
  const practiceEffectiveness: PracticeEffectiveness[] = [];
  Object.entries(effectivenessMap).forEach(([practiceId, moodMap]) => {
    Object.entries(moodMap).forEach(([mood, data]) => {
      if (data.count > 0) {
        practiceEffectiveness.push({
          practiceId,
          mood: mood as MoodValue,
          effectivenessScore: data.total / data.count,
          usageCount: data.count,
          positiveOutcomeCount: Math.round(data.total)
        });
      }
    });
  });

  return practiceEffectiveness;
};

// Main function to get ML-powered recommendations
export const getMLRecommendations = (
  mood: MoodValue,
  timeAvailable: TimeAvailable,
  onShift: boolean,
  practices: Practice[],
  historicalData: BurnoutData
): Practice[] => {
  const { checkIns, resets } = historicalData;
  const currentHour = new Date().getHours();

  // Analyze user patterns
  const userPatterns = analyzeUserPatterns(checkIns, resets);

  // Build effectiveness data
  const practiceEffectiveness = buildPracticeEffectiveness(checkIns, resets);

  // Score all practices based on ML algorithm
  const scoredPractices = practices
    .filter(practice => 
      practice.tags.includes(mood) && 
      (timeAvailable === "2m" ? practice.durationSeconds <= 180 : true) &&
      (timeAvailable === "5m" ? practice.durationSeconds > 180 : true)
    )
    .map(practice => ({
      practice,
      score: calculatePracticeScore(
        practice,
        mood,
        timeAvailable,
        userPatterns,
        practiceEffectiveness,
        currentHour
      )
    }))
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .map(item => item.practice); // Extract practices

  // If we don't have enough historical data, fallback to the original algorithm
  if (scoredPractices.length === 0) {
    // Fallback to original recommendation logic
    return practices.filter(p => p.tags.includes(mood))
      .filter(p => timeAvailable === "2m" ? p.durationSeconds <= 180 : true)
      .slice(0, 3);
  }

  return scoredPractices;
};

// Function to get practice effectiveness for a specific user and mood
export const getPracticeEffectivenessForMood = (
  practiceId: string,
  mood: MoodValue,
  effectivenessData: PracticeEffectiveness[]
): number => {
  const effectiveness = effectivenessData.find(e => 
    e.practiceId === practiceId && e.mood === mood
  );
  
  return effectiveness ? effectiveness.effectivenessScore : 0.5; // Default to neutral
};