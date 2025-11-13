import { BurnoutData, MoodCheckIn, ResetLog } from "@/types";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

export interface WeeklyPoint {
  date: string;
  label: string;
  checkIns: number;
  resets: number;
}

export interface WeeklySummary {
  points: WeeklyPoint[];
  streak: number;
  bestDay?: string;
}

const lastNDays = (days: number) => {
  const list: Date[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    list.push(startOfDay(subDays(new Date(), i)));
  }
  return list;
};

const countForDay = <T extends { timestamp?: string; startedAt?: string; completedAt?: string }>(
  items: T[],
  day: Date
) =>
  items.filter((item) => {
    const iso = "timestamp" in item ? item.timestamp : item.startedAt;
    if (!iso) return false;
    return isSameDay(new Date(iso), day);
  }).length;

export const buildWeeklySummary = (checkIns: MoodCheckIn[], resets: ResetLog[]): WeeklySummary => {
  const days = lastNDays(7);
  const points: WeeklyPoint[] = days.map((day) => {
    const label = format(day, "EEE");
    return {
      date: day.toISOString(),
      label,
      checkIns: countForDay(checkIns, day),
      resets: countForDay(resets, day),
    };
  });

  let currentStreak = 0;
  let bestDay: WeeklyPoint | undefined;

  points.forEach((point) => {
    if (point.checkIns > 0 || point.resets > 0) {
      currentStreak += 1;
      if (!bestDay || point.checkIns + point.resets > bestDay.checkIns + bestDay.resets) {
        bestDay = point;
      }
    } else {
      currentStreak = 0;
    }
  });

  return {
    points,
    streak: currentStreak,
    bestDay: bestDay?.label,
  };
};

export const emptyBurnoutData: BurnoutData = {
  checkIns: [],
  resets: [],
  settings: { reducedMotion: false },
};
