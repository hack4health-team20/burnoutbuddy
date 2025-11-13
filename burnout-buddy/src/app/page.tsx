"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Clock3, HeartPulse, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const featureItems = [
  {
    title: "10-second check-in",
    description: "Tap an emoji to capture the moment without slowing down your shift.",
    icon: Sparkles,
  },
  {
    title: "2–3 minute micro-resets",
    description: "Get a guided breathing, movement, or mindset mini-practice tailored to how you feel.",
    icon: Clock3,
  },
  {
    title: "Gentle support",
    description: "No clinical advice, no PHI—just a calming space to reset between patients.",
    icon: HeartPulse,
  },
  {
    title: "Weekly trend",
    description: "See how often you check in and keep an eye on your streak with a simple chart.",
    icon: BarChart3,
  },
];

export default function LandingPage() {
  const { startDemo, signInWithGoogle, error } = useAuth();
  const router = useRouter();

  const handleDemo = () => {
    startDemo();
    router.push("/app/home");
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push("/app/home");
    } catch (err) {
      console.warn("Sign-in issue", err);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl rounded-[var(--radius-xl)] border border-white/40 bg-white/70 px-8 py-12 text-center shadow-[var(--shadow-elevated)] backdrop-blur-2xl sm:px-16"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-[var(--muted)]/70">
          Burnout Buddy
        </div>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-[var(--text)] sm:text-5xl">
          A serene 3-minute reset space crafted for physicians
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted)]">
          Slip in, check how you&#39;re doing, and step back out steadier than before. No PHI, no clinical
          advice—just calming guidance that respects your pace.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={handleDemo} className="w-full sm:w-auto">
            Try Demo (no login)
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleSignIn}
            className="w-full sm:w-auto"
          >
            Sign in with Google
          </Button>
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-500/80">{error}</p>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mt-12 grid w-full max-w-5xl gap-6 sm:grid-cols-2"
      >
        {featureItems.map((feature) => (
          <div
            key={feature.title}
            className="rounded-[var(--radius-lg)] border border-white/40 bg-white/60 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl"
          >
            <feature.icon className="h-8 w-8 text-[var(--accent)]" />
            <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">{feature.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{feature.description}</p>
          </div>
        ))}
      </motion.section>
    </div>
  );
}
