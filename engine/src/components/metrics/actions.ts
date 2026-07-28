"use server";

import { revalidatePath } from "next/cache";
import { listPublicationsForAsset, setPublicationMetrics } from "@/db/repo";
import { parseMetrics, type PublicationMetrics } from "./types";

// Metrics are recorded per live publication. The row is resolved server-side
// from (assetId, platform) so callers never need to thread publication ids.

function findLive(assetId: string, platform: string) {
  return listPublicationsForAsset(assetId).find((p) => p.platform === platform && p.status === "live") ?? null;
}

/** Current recorded metrics for a live publication, for forms that load their own state. */
export async function getPublicationMetricsAction(
  assetId: string,
  platform: string
): Promise<{ ok: true; metrics: PublicationMetrics | null } | { ok: false; error: string }> {
  const pub = findLive(assetId, platform);
  if (!pub) return { ok: false, error: "No live publication for this platform yet." };
  return { ok: true, metrics: parseMetrics(pub.metricsJson) };
}

/** Record views, clicks, and a note on a live publication, then refresh every screen that shows them. */
export async function savePublicationMetricsAction(input: {
  assetId: string;
  platform: string;
  solutionId: string;
  views: number | null;
  clicks: number | null;
  notes: string;
}): Promise<{ ok: true; metrics: PublicationMetrics } | { ok: false; error: string }> {
  const pub = findLive(input.assetId, input.platform);
  if (!pub) return { ok: false, error: "No live publication for this platform yet." };

  const metrics: { views?: number; clicks?: number; notes?: string } = {};
  if (input.views != null && Number.isFinite(input.views)) metrics.views = Math.max(0, Math.round(input.views));
  if (input.clicks != null && Number.isFinite(input.clicks)) metrics.clicks = Math.max(0, Math.round(input.clicks));
  const notes = input.notes.trim();
  if (notes) metrics.notes = notes;

  setPublicationMetrics(pub.id, metrics);
  revalidatePath(`/solutions/${input.solutionId}/assets/${input.assetId}`);
  revalidatePath(`/solutions/${input.solutionId}`);
  revalidatePath("/");
  return { ok: true, metrics: { ...metrics, recordedAt: Date.now() } };
}
