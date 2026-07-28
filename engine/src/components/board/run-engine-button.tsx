"use client";

import { useState, useTransition } from "react";
import { runEngineAction } from "@/app/solutions/[id]/actions";
import type { EngineType } from "@/lib/engines/prompts";

// Generate / retry / regenerate button for one engine. The action is a slow
// awaited LLM call, the button holds its pending label until the run lands and
// the board revalidates underneath it.
export function RunEngineButton({
  type,
  solutionId,
  label,
  pendingLabel = "Working…",
  tone = "default",
}: {
  type: EngineType;
  solutionId: string;
  label: string;
  pendingLabel?: string;
  tone?: "default" | "primary" | "amber";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await runEngineAction(type, solutionId);
      if (!result.ok && result.error) setError(result.error);
    });
  };

  const toneClass =
    tone === "primary" ? "btn-primary" : tone === "amber" ? "border-(--amber) text-(--amber)" : "";

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" className={`btn ${toneClass}`} onClick={run} disabled={isPending}>
        {isPending ? pendingLabel : label}
      </button>
      {error ? <p className="text-xs text-(--red)">{error}</p> : null}
    </div>
  );
}
