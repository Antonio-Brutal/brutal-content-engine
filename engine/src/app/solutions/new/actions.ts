"use server";

import { revalidatePath } from "next/cache";
import { createSolution, ensureSolutionDocAsset, getAsset, setAssetStatus, updateSolution, writeVersion } from "@/db/repo";

export async function createSolutionAction(input: { title: string; dumpRaw?: string; links?: string }) {
  const s = createSolution(input);
  revalidatePath("/");
  revalidatePath("/solutions");
  return { id: s.id };
}

export async function updateSolutionAction(
  solutionId: string,
  patch: { title?: string; dumpRaw?: string; links?: string; interviewLog?: string }
) {
  updateSolution(solutionId, patch);
  revalidatePath("/");
  revalidatePath("/solutions");
  revalidatePath(`/solutions/${solutionId}`);
}

/**
 * Persist the streamed draft as the solution doc. The draft-doc route already writes
 * the AI version on finalize; this action is the deterministic fallback (e.g. the
 * finalize write raced or the connection dropped) and is idempotent: it only writes
 * a new version when the asset body differs from what the client holds.
 */
export async function saveDraftDocAction(solutionId: string, bodyMd: string) {
  const asset = ensureSolutionDocAsset(solutionId);
  const current = getAsset(asset.id);
  if (!current || current.bodyMd !== bodyMd) {
    writeVersion(asset.id, bodyMd, "ai");
  }
  setAssetStatus(asset.id, "draft");
  revalidatePath("/");
  revalidatePath("/solutions");
  revalidatePath(`/solutions/${solutionId}`);
  return { assetId: asset.id };
}
