"use client";

import { useState, useTransition } from "react";
import { runDistillation } from "./actions";

type DistillResult = { processed: number; proposed: number; error?: string };

export function VoiceLoop({ unprocessedCount }: { unprocessedCount: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DistillResult | null>(null);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-medium">{unprocessedCount}</span> unprocessed edit{" "}
            {unprocessedCount === 1 ? "diff" : "diffs"}.
          </p>
          <p className="mt-1 text-xs text-(--muted)">
            Every approval where you edited the draft is captured. Distillation turns recurring edits into proposed
            rules, nothing activates without you.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          disabled={pending || unprocessedCount === 0}
          onClick={() =>
            startTransition(async () => {
              setResult(null);
              setResult(await runDistillation());
            })
          }
        >
          {pending ? "Distilling" : "Run distillation"}
        </button>
      </div>
      {result ? (
        result.error ? (
          <p className="mt-3 text-sm text-(--amber)">{result.error}</p>
        ) : (
          <p className="mt-3 text-sm text-(--muted)">
            Processed {result.processed} {result.processed === 1 ? "diff" : "diffs"}. Proposed {result.proposed}{" "}
            {result.proposed === 1 ? "rule" : "rules"}.
          </p>
        )
      ) : null}
    </div>
  );
}
