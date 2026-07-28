"use server";

import { revalidatePath } from "next/cache";
import { runAdhoc, type RunResult } from "@/lib/engines/generate";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";

/** Studio: generate a standalone asset from an ad-hoc brief. Slow (30-90s LLM call). */
export async function runAdhocAction(type: EngineType, brief: string): Promise<RunResult> {
  if (!(type in ENGINE_LABELS)) {
    return { ok: false, assetId: "", error: `Unknown engine type "${type}".` };
  }
  if (!brief.trim()) {
    return { ok: false, assetId: "", error: "The brief is empty, the closed world needs at least one fact." };
  }
  const result = await runAdhoc(type, brief);
  revalidatePath("/studio");
  if (result.assetId) revalidatePath(`/studio/assets/${result.assetId}`);
  return result;
}
