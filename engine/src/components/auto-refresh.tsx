"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Polls the server every 5 seconds while a generation is in flight so the board
// updates itself without manual reloads. When the flight lands (active flips
// false on a refresh cycle) a browser notification announces it. Renders
// nothing and runs nothing while inactive.
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  const wasActive = useRef(false);

  // Ask for notification permission the first time a generation is watched.
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        /* denied or unsupported, the poll still works */
      });
    }
  }, [active]);

  useEffect(() => {
    if (active) {
      wasActive.current = true;
      const timer = setInterval(() => router.refresh(), 5000);
      return () => clearInterval(timer);
    }
    if (wasActive.current) {
      wasActive.current = false;
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Generation finished");
        } catch {
          /* best-effort, never breaks the page */
        }
      }
    }
  }, [active, router]);

  return null;
}

export default AutoRefresh;
