// Next.js instrumentation hook: schedules the voice-loop distillation once a day
// while the server runs, so recurring edit patterns become proposed rules without
// anyone pressing the button. Proposed rules still require human activation in /brand.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const g = globalThis as typeof globalThis & { __voiceLoopTimer?: ReturnType<typeof setInterval> };
  if (g.__voiceLoopTimer) return;

  const DAY = 24 * 60 * 60 * 1000;
  g.__voiceLoopTimer = setInterval(async () => {
    try {
      const { distillDiffs } = await import("@/lib/voice");
      const result = await distillDiffs();
      if (result.processed > 0) {
        console.log(`[voice-loop] processed ${result.processed} diffs, proposed ${result.proposed} rules`);
      }
    } catch (e) {
      console.warn("[voice-loop] scheduled distillation failed:", e instanceof Error ? e.message : e);
    }
  }, DAY);
  g.__voiceLoopTimer.unref?.();
}
