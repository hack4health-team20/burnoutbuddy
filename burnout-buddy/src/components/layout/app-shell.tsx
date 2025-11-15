"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/app/home", label: "Today" },
  { href: "/app/insights", label: "Insights" },
  { href: "/app/library", label: "Library" },
  { href: "/app/settings", label: "Settings" },
];

interface AppShellProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export const AppShell = ({ title, description, children }: AppShellProps) => {
  const pathname = usePathname();
  const { user, isDemo, signOut, sessionType } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const greetingName = user?.displayName ? user.displayName.replace(/^Dr\.?\s*/i, "Dr. ") : "Dr. Friend";

  return (
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-10">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-6 z-20 flex items-center justify-between rounded-[28px] border border-white/40 bg-white/80 px-6 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl"
      >
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]/70">
            Burnout Buddy
          </span>
          <span className="text-sm font-medium text-[var(--text)]">
            Hi, {isDemo ? "there" : greetingName}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:bg-white/70"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {sessionType && (
            <Button
              variant="ghost"
              size="sm"
              subtleHover
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                try {
                  await signOut();
                } finally {
                  setSigningOut(false);
                }
              }}
            >
              {signingOut ? "Signing out…" : isDemo ? "Leave demo" : "Sign out"}
            </Button>
          )}
        </div>
      </motion.nav>

      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08 }}
        className="rounded-[var(--radius-xl)] border border-white/50 bg-white/75 px-8 py-10 shadow-[var(--shadow-elevated)] backdrop-blur-xl"
      >
        <h1 className="text-4xl font-semibold text-[var(--text)]">
          {title ?? "Today"}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-[var(--muted)]">{description}</p>}
      </motion.header>

      <main className="flex flex-1 flex-col gap-8 pb-8">{children}</main>
    </div>
  );
};
