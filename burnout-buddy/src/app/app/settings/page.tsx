"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChipToggle } from "@/components/ui/chip-toggle";
import { useAppState } from "@/context/app-state-context";
import { useAuth } from "@/context/auth-context";

export default function SettingsPage() {
  const { settings, setReducedMotion, clearAllData, exportData } = useAppState();
  const { isDemo, signOut } = useAuth();

  return (
    <AppShell
      title="Settings & About"
      description="Your reflections live privately on your device (or encrypted in Firestore when signed in)."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Data privacy</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text)]">Where your data lives</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {isDemo
                ? "Demo mode stores check-ins securely in your browser using localStorage."
                : "Signed-in mode stores your data in a private Firestore document that only you can access."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={exportData}>
              Export JSON
            </Button>
            <Button variant="ghost" onClick={() => void clearAllData()}>
              Clear data
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">Accessibility</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text)]">Reduced motion</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Prefer calmer transitions? Toggle reduced motion for a low-stimulation experience.
            </p>
          </div>
          <div className="flex gap-3">
            <ChipToggle active={!settings.reducedMotion} onClick={() => setReducedMotion(false)}>
              Full motion
            </ChipToggle>
            <ChipToggle active={settings.reducedMotion} onClick={() => setReducedMotion(true)}>
              Reduced motion
            </ChipToggle>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">About Burnout Buddy</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Burnout Buddy helps physicians build micro-moments of regulation into demanding days. No
            PHI, no diagnoses—just a supportive exhale between patients.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => void signOut()}>
            {isDemo ? "Leave demo" : "Sign out"}
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
