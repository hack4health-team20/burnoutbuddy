"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CountdownStatus = "idle" | "running" | "paused" | "completed";

interface CountdownOptions {
  autostart?: boolean;
  onComplete?: () => void;
}

export const useCountdown = (durationSeconds: number, options: CountdownOptions = {}) => {
  const { autostart = true, onComplete } = options;
  const [remaining, setRemaining] = useState(durationSeconds);
  const [status, setStatus] = useState<CountdownStatus>(autostart ? "running" : "idle");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTicker = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        clearTicker();
        setStatus("completed");
        onComplete?.();
        return 0;
      }
      return prev - 1;
    });
  }, [onComplete]);

  useEffect(() => {
    if (status === "running" && !intervalRef.current) {
      intervalRef.current = setInterval(tick, 1000);
    }

    return clearTicker;
  }, [status, tick]);

  useEffect(() => {
    setRemaining(durationSeconds);
    setStatus(autostart ? "running" : "idle");
    clearTicker();
    if (autostart) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return clearTicker;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds]);

  const start = useCallback(() => {
    if (status === "running") return;
    setRemaining(durationSeconds);
    setStatus("running");
  }, [durationSeconds, status]);

  const pause = useCallback(() => {
    setStatus("paused");
    clearTicker();
  }, []);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    setStatus("running");
  }, [status]);

  const reset = useCallback(() => {
    clearTicker();
    setRemaining(durationSeconds);
    setStatus(autostart ? "running" : "idle");
  }, [autostart, durationSeconds]);

  return {
    remaining,
    status,
    start,
    pause,
    resume,
    reset,
  };
};
