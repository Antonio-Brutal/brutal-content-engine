"use server";

import { revalidatePath } from "next/cache";
import { getAsset } from "@/db/repo";
import { runRepurpose } from "@/lib/engines/generate";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";

export type RepurposeResult = {
  ok: boolean;
  assetId: string;
  solutionId: string | null;
  error?: string;
};

/**
 * Repurpose a source asset into a target format. Creates a NEW asset that
 * inherits the source's solution (or none), slow (30-90s LLM call).
 */
export async function runRepurposeAction(sourceAssetId: string, targetType: EngineType): Promise<RepurposeResult> {
  if (!(targetType in ENGINE_LABELS)) {
    return { ok: false, assetId: "", solutionId: null, error: `Unknown target type "${targetType}".` };
  }
  const result = await runRepurpose(sourceAssetId, targetType);
  const created = result.assetId ? getAsset(result.assetId) : undefined;
  const solutionId = created?.solutionId ?? null;

  revalidatePath("/repurpose");
  if (result.assetId) {
    if (solutionId) {
      revalidatePath(`/solutions/${solutionId}`);
      revalidatePath(`/solutions/${solutionId}/assets/${result.assetId}`);
    } else {
      revalidatePath("/studio");
      revalidatePath(`/studio/assets/${result.assetId}`);
    }
  }
  return { ok: result.ok, assetId: result.assetId, solutionId, error: result.error };
}
