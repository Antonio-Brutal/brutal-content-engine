"use server";

import { revalidatePath } from "next/cache";
import { getAsset } from "@/db/repo";
import { generateGermanVariant, runCompliancePass, runEditPass } from "@/lib/compliance";
import { runBlogVariants } from "@/lib/engines/generate";

// Server actions for the asset panel intelligence layer: compliance review,
// German localization, the copy-editing second pass, and blog variants.
// All of these are slow awaited LLM calls; callers hold pending state.

function revalidateAssetPanel(solutionId: string, assetId: string) {
  revalidatePath(`/solutions/${solutionId}/assets/${assetId}`);
  revalidatePath(`/solutions/${solutionId}`);
}

/** Re-run the compliance judge and pin the fresh review to the asset. */
export async function rerunReviewAction(
  assetId: string,
  solutionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const review = await runCompliancePass(assetId);
  revalidateAssetPanel(solutionId, assetId);
  if (!review) {
    return { ok: false, error: "The review pass returned nothing. Check the body and the LLM configuration, then retry." };
  }
  return { ok: true };
}

/** Generate (or regenerate) the German variant stored on the asset. SLOW (~1 min). */
export async function generateGermanAction(
  assetId: string,
  solutionId: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await generateGermanVariant(assetId);
  revalidateAssetPanel(solutionId, assetId);
  return result;
}

/** The copy-editing second pass; writes a new AI version. SLOW (~1 min). */
export async function editPassAction(
  assetId: string,
  solutionId: string
): Promise<{ ok: boolean; summary?: string; error?: string; bodyMd?: string }> {
  const result = await runEditPass(assetId);
  revalidateAssetPanel(solutionId, assetId);
  if (result.ok) {
    return { ...result, bodyMd: getAsset(assetId)?.bodyMd };
  }
  return result;
}

/** Two blog drafts judged against each other; the winner lands as the working draft. VERY SLOW (~4 min, double cost). */
export async function blogVariantsAction(
  solutionId: string,
  assetId: string
): Promise<{ ok: boolean; error?: string; judgeSummary?: string; bodyMd?: string }> {
  const result = await runBlogVariants(solutionId);
  revalidateAssetPanel(solutionId, assetId);
  if (result.ok) {
    return { ...result, bodyMd: getAsset(result.assetId)?.bodyMd };
  }
  return result;
}
