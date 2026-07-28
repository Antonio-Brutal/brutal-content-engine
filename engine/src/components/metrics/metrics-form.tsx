"use client";

import { useEffect, useState, useTransition } from "react";
import { getPublicationMetricsAction, savePublicationMetricsAction } from "./actions";
import type { PublicationMetrics } from "./types";

// Inline per-live-publication performance recording: views, clicks, a note.
// Numbers are typed by hand (no analytics integration) and stored on the
// publication row. The recorded summary stays visible, the form folds away.
export function MetricsForm({
  assetId,
  platform,
  solutionId,
  initial,
}: {
  assetId: string;
  platform: string;
  solutionId: string;
  /** Parsed metricsJson when the caller has it; omit and the form loads its own. */
  initial?: PublicationMetrics | null;
}) {
  const [metrics, setMetrics] = useState<PublicationMetrics | null>(initial ?? null);
  const [views, setViews] = useState(initial?.views != null ? String(initial.views) : "");
  const [clicks, setClicks] = useState(initial?.clicks != null ? String(initial.clicks) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Transitional self-load: current callers do not pass metricsJson yet.
  useEffect(() => {
    if (initial !== undefined) return;
    let cancelled = false;
    getPublicationMetricsAction(assetId, platform).then((r) => {
      if (cancelled || !r.ok || !r.metrics) return;
      setMetrics(r.metrics);
      setViews(r.metrics.views != null ? String(r.metrics.views) : "");
      setClicks(r.metrics.clicks != null ? String(r.metrics.clicks) : "");
      setNotes(r.metrics.notes ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [assetId, platform, initial]);

  const save = () => {
    setError(null);
    setSaved(false);
    const v = views.trim() === "" ? null : Number(views);
    const c = clicks.trim() === "" ? null : Number(clicks);
    if ((v != null && !Number.isFinite(v)) || (c != null && !Number.isFinite(c))) {
      setError("Views and clicks must be numbers.");
      return;
    }
    startTransition(async () => {
      const result = await savePublicationMetricsAction({ assetId, platform, solutionId, views: v, clicks: c, notes });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMetrics(result.metrics);
      setSaved(true);
    });
  };

  const hasNumbers = metrics != null && (metrics.views != null || metrics.clicks != null);

  return (
    <div className="mt-2">
      {hasNumbers ? (
        <p className="font-mono text-xs text-(--muted)">
          {metrics?.views ?? 0} views · {metrics?.clicks ?? 0} clicks
        </p>
      ) : null}
      <details className="mt-1">
        <summary className="label cursor-pointer select-none">Record metrics.</summary>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            className="input w-24"
            placeholder="Views"
            value={views}
            onChange={(e) => setViews(e.target.value)}
            disabled={isPending}
          />
          <input
            type="number"
            min={0}
            className="input w-24"
            placeholder="Clicks"
            value={clicks}
            onChange={(e) => setClicks(e.target.value)}
            disabled={isPending}
          />
          <input
            className="input max-w-xs"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
          />
          <button type="button" className="btn" onClick={save} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-(--red)">{error}</p> : null}
        {saved && !error ? <p className="mt-2 text-sm text-(--lime)">Saved.</p> : null}
      </details>
    </div>
  );
}
