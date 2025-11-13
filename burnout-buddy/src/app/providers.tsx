"use client";

import { MotionConfig } from "framer-motion";
import { PropsWithChildren } from "react";
import { AuthProvider } from "@/context/auth-context";
import { AppStateProvider, useAppState } from "@/context/app-state-context";

const MotionBridge = ({ children }: PropsWithChildren) => {
  const { settings } = useAppState();
  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
};

export function Providers({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <AppStateProvider>
        <MotionBridge>{children}</MotionBridge>
      </AppStateProvider>
    </AuthProvider>
  );
}
