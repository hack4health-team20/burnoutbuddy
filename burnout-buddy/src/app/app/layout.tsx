"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sessionType, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !sessionType) {
      router.replace("/");
    }
  }, [loading, sessionType, router]);

  if (loading || !sessionType) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-[var(--radius-lg)] border border-white/40 bg-white/75 px-6 py-4 text-sm text-[var(--muted)] shadow-[var(--shadow-soft)]"
        >
          Preparing your reset space…
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
