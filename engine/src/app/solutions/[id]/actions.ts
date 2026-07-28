"use server";

import { revalidatePath } from "next/cache";
import { getAsset, markPublished, publishSolution, saveWorkingBody } from "@/db/repo";
import { approveAsset, publishSolutionAndDraftBlog, runEngine, type RunResult } from "@/lib/engines/generate";
import { formatForPlatform, unresolvedTokens } from "@/lib/engines/exports";
import type { EngineType } from "@/lib/engines/prompts";

function revalidateBoard(solutionId: string) {
  revalidatePath(`/solutions/${solutionId}`);
  revalidatePath("/solutions");
  revalidatePath("/");
}

/** Persist the working copy on the asset row. No version is written (spec §05). */
export async function saveWorkingBodyAction(assetId: string, solutionId: string, bodyMd: string) {
  saveWorkingBody(assetId, bodyMd);
  revalidatePath(`/solutions/${solutionId}`);
  return { ok: true as const };
}

/**
 * Legacy doc approval (no blog draft). Kept for compile compatibility with the
 * pre-board doc editor; the board itself uses publishAndDraftBlogAction below.
 */
export async function publishSolutionAction(solutionId: string, assetId: string, bodyMd: string) {
  saveWorkingBody(assetId, bodyMd);
  const { version } = publishSolution(solutionId);
  revalidateBoard(solutionId);
  return { ok: true as const, version };
}

/**
 * Stage one of the fan-out: save the on-screen body, approve + publish the doc,
 * then auto-draft the blog. SLOW (~60s LLM call), the caller shows pending state.
 */
export async function publishAndDraftBlogAction(solutionId: string, assetId: string, bodyMd: string): Promise<RunResult> {
  saveWorkingBody(assetId, bodyMd);
  const result = await publishSolutionAndDraftBlog(solutionId);
  revalidateBoard(solutionId);
  if (result.assetId) revalidatePath(`/solutions/${solutionId}/assets/${result.assetId}`);
  return result;
}

/** Run one engine (generate / retry / regenerate-from-stale). SLOW, awaited. */
export async function runEngineAction(type: EngineType, solutionId: string): Promise<RunResult> {
  const result = await runEngine(type, solutionId);
  revalidateBoard(solutionId);
  if (result.assetId) revalidatePath(`/solutions/${solutionId}/assets/${result.assetId}`);
  return result;
}

/** Regenerate from the asset panel; returns the fresh body so the editor can swap it in. */
export async function regenerateAssetAction(type: EngineType, solutionId: string): Promise<RunResult & { bodyMd?: string }> {
  const result = await runEngine(type, solutionId);
  revalidateBoard(solutionId);
  if (result.assetId) revalidatePath(`/solutions/${solutionId}/assets/${result.assetId}`);
  if (result.ok) {
    const fresh = getAsset(result.assetId);
    return { ...result, bodyMd: fresh?.bodyMd };
  }
  return result;
}

/** Save the working copy of an asset (asset panel edit mode). */
export async function saveAssetBodyAction(assetId: string, solutionId: string, bodyMd: string) {
  saveWorkingBody(assetId, bodyMd);
  revalidatePath(`/solutions/${solutionId}/assets/${assetId}`);
  revalidatePath(`/solutions/${solutionId}`);
  return { ok: true as const };
}

/**
 * Approve an asset: saves the on-screen body first so the human version matches
 * the editor, then approveAsset captures the edit diff, writes the version,
 * cascades staleness, and, when the asset is the blog, fans out page, tweet,
 * LinkedIn, and case study. VERY SLOW for the blog (3+ min), awaited.
 */
export async function approveAssetAction(
  assetId: string,
  solutionId: string,
  bodyMd: string
): Promise<{ ok: true; version: number; fanned: RunResult[] } | { ok: false; error: string }> {
  try {
    saveWorkingBody(assetId, bodyMd);
    const { version, fanned } = await approveAsset(assetId);
    revalidateBoard(solutionId);
    revalidatePath(`/solutions/${solutionId}/assets/${assetId}`);
    return { ok: true, version, fanned };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Format an asset body for a platform's clipboard. Re-checks the token lock
 * server-side at copy time, social copy stays locked until upstream URLs exist.
 */
export async function formatForPlatformAction(
  assetId: string,
  platform: string
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const asset = getAsset(assetId);
  if (!asset) return { ok: false, error: "Asset not found." };
  const locked = unresolvedTokens(asset.bodyMd, asset.solutionId);
  if (locked.length) {
    return { ok: false, error: `Locked, unresolved tokens: ${locked.join(", ")}. Mark the blog/page published first.` };
  }
  return { ok: true, text: formatForPlatform(platform, asset.bodyMd, asset.solutionId) };
}

/** Record a live publication URL, this is what resolves {{blog_url}}/{{page_url}} tokens. */
export async function markPublishedAction(assetId: string, solutionId: string, platform: string, url: string) {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false as const, error: "A URL is required." };
  markPublished(assetId, platform, trimmed);
  revalidateBoard(solutionId);
  revalidatePath(`/solutions/${solutionId}/assets/${assetId}`);
  return { ok: true as const };
}
