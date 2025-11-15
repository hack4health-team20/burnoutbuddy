export type MoodValue = "calm" | "ok" | "stressed" | "exhausted";

export type TimeAvailable = "2m" | "5m";

export type PostMood = "better" | "same";

export interface PracticeCue {
  inhale?: number;
  hold?: number;
  exhale?: number;
  rest?: number;
}

export interface Practice {
  id: string;
  name: string;
  durationSeconds: number;
  category: "breathing" | "movement" | "mindset" | "visual" | "gratitude";
  tags: MoodValue[];
  summary: string;
  whyItHelps: string;
  steps: string[];
  cue?: PracticeCue;
  timeOptions?: TimeAvailable[];
}

export interface MoodCheckIn {
  id: string;
  mood: MoodValue;
  shift: boolean;
  timeAvailable: TimeAvailable;
  timestamp: string; // ISO string
  practiceId: string;
  postMood?: PostMood;
}

export interface ResetLog {
  id: string;
  practiceId: string;
  mood: MoodValue;
  startedAt: string;
  completedAt?: string;
  timeAvailable: TimeAvailable;
  postMood?: PostMood;
  checkInId?: string | null; // Reference to the originating check-in
}

export interface AppSettings {
  reducedMotion: boolean;
  displayName?: string;
}

export interface BurnoutData {
  checkIns: MoodCheckIn[];
  resets: ResetLog[];
  settings: AppSettings;
}

export type SessionType = "demo" | "firebase";

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string | null;
  photoURL?: string | null;
}

export interface RecommendationResult {
  primary: Practice;
  alternatives: Practice[];
  reason: string;
}

export interface MoodFormState {
  mood?: MoodValue;
  shift: boolean;
  timeAvailable: TimeAvailable;
}

export interface TimerSession {
  id: string;
  practice: Practice;
  startedAt: string;
  durationSeconds: number;
  mood: MoodValue;
  timeAvailable: TimeAvailable;
}

export interface GamificationInput {
  doctorName: string;
  streakDays: number;
  bestDay?: string;
  weekCheckIns: number;
  weekResets: number;
  lifetimeCheckIns: number;
  lifetimeResets: number;
  recentMoods: MoodValue[];
  recentPractices: string[];
  highlightPractices: { name: string; completedAt?: string }[];
}

export interface GamificationStories {
  achievementStory: string;
  streakCelebration: string;
  progressNarrative: string;
}
