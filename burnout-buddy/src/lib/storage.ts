import { BurnoutData } from "@/types";

export const DEMO_STORAGE_KEY = "burnout-buddy-demo-data";
export const AUTH_STORAGE_KEY = "burnout-buddy-auth-session";

export const readLocalData = (): BurnoutData | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BurnoutData;
  } catch (error) {
    console.error("Failed to parse local Burnout Buddy data", error);
    return null;
  }
};

export const writeLocalData = (data: BurnoutData) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
};

export const clearLocalData = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
};

export const downloadJson = (filename: string, data: BurnoutData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
