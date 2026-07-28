"use client";

import { useState, useTransition } from "react";
import type { Review } from "@/lib/compliance";
import { rerunReviewAction } from "./actions";

// The compliance judge's verdict, pinned to the asset by the post-draft hook.
// Three scores plus the concrete violations; re-running is a slow awaited call.

function toneFor(value: number) {
  if (value >= 80) return "text-(--lime)";
  if (value >= 60) return "text-(--amber)";
  return "text-(--red)";
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className={`font-mono text-3xl tabular-nums ${toneFor(value)}`}>{value}</p>
      <p className="label mt-1">{label}</p>
    </div>
  );
}

export function ReviewCard({
  assetId,
  solutionId,
  review,
}: {
  assetId: string;
  solutionId: string;
  review: Review | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const rerun = () => {
    setError(null);
    startTransition(async () => {
      const result = await rerunReviewAction(assetId, solutionId);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label">Compliance review.</p>
        <button type="button" className="btn" onClick={rerun} disabled={isPending}>
          {isPending ? "Reviewing… (~30s)" : "Re-run review"}
        </button>
      </div>
      {review ? (
        <>
          <div className="mt-4 flex flex-wrap gap-10">
            <Score label="Overall." value={review.score} />
            <Score label="Citability." value={review.citability} />
            <Score label="Hallmark." value={review.hallmark} />
          </div>
          {review.violations.length ? (
            <ul className="mt-4 space-y-1.5 border-t border-(--line) pt-4">
              {review.violations.map((v, i) => (
                <li key={i} className="text-xs leading-relaxed text-(--muted)">
                  {v}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t border-(--line) pt-4 text-xs text-(--muted)">No violations recorded.</p>
          )}
          <p className="label mt-4">Reviewed {new Date(review.at).toISOString().slice(0, 10)}.</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-(--muted)">Not reviewed yet.</p>
      )}
      {error ? <p className="mt-3 text-xs text-(--red)">{error}</p> : null}
    </div>
  );
}
