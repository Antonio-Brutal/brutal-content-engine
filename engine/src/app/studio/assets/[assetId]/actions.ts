"use server";

import { revalidatePath } from "next/cache";
import { saveWorkingBody } from "@/db/repo";
import { approveAsset } from "@/lib/engines/generate";

/** Persist the working copy on the asset row. No version is written. */
export async function saveStudioBodyAction(assetId: string, bodyMd: string) {
  saveWorkingBody(assetId, bodyMd);
  revalidatePath(`/studio/assets/${assetId}`);
  revalidatePath("/studio");
  return { ok: true as const };
}

/**
 * Approve a standalone asset: save the on-screen body first so the approved
 * version matches the editor, then approveAsset, it captures the edit diff and
 * writes the human version. No fan-out fires for solution-less assets.
 */
export async function approveStudioAssetAction(assetId: string, bodyMd: string) {
  saveWorkingBody(assetId, bodyMd);
  const { version } = await approveAsset(assetId);
  revalidatePath(`/studio/assets/${assetId}`);
  revalidatePath("/studio");
  return { ok: true as const, version };
}
