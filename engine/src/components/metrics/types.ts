// Shared shape of publications.metricsJson: manually recorded performance
// numbers, written by setPublicationMetrics. Plain module, safe to import from
// server pages and client components alike.

export type PublicationMetrics = {
  views?: number;
  clicks?: number;
  notes?: string;
  recordedAt?: number;
};

/** Parses a publication row's metricsJson; missing or bad JSON reads as null. */
export function parseMetrics(metricsJson: string | null | undefined): PublicationMetrics | null {
  if (!metricsJson) return null;
  try {
    const m = JSON.parse(metricsJson) as unknown;
    return m && typeof m === "object" ? (m as PublicationMetrics) : null;
  } catch {
    return null;
  }
}
