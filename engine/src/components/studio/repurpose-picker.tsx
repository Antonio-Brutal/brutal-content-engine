"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runRepurposeAction } from "@/app/repurpose/actions";
import type { EngineType } from "@/lib/engines/prompts";

export type SourceGroup = {
  label: string;
  options: { id: string; label: string }[];
};

// Two-column picker: source asset (grouped by solution) on the left, target
// format on the right. Everything data-shaped arrives as props so the db-backed
// modules stay server-only.
export function RepurposePicker({
  groups,
  targets,
}: {
  groups: SourceGroup[];
  targets: { value: EngineType; label: string }[];
}) {
  const router = useRouter();
  const firstSource = groups[0]?.options[0]?.id ?? "";
  const [sourceId, setSourceId] = useState(firstSource);
  const [target, setTarget] = useState<EngineType>(targets[0]?.value ?? "blog");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const repurpose = () =>
    startTransition(async () => {
      setError(null);
      const result = await runRepurposeAction(sourceId, target);
      if (result.ok) {
        router.push(
          result.solutionId
            ? `/solutions/${result.solutionId}/assets/${result.assetId}`
            : `/studio/assets/${result.assetId}`
        );
      } else {
        setError(result.error ?? "Repurpose failed.");
      }
    });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-5">
        <p className="label mb-2">Source asset.</p>
        <select
          className="select"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          disabled={isPending}
        >
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-3 text-xs text-(--muted)">Any asset with a body can be a source, approved or not.</p>
      </div>

      <div className="card p-5">
        <p className="label mb-2">Target format.</p>
        <select
          className="select"
          value={target}
          onChange={(e) => setTarget(e.target.value as EngineType)}
          disabled={isPending}
        >
          {targets.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={repurpose}
            disabled={isPending || !sourceId}
          >
            Repurpose
          </button>
          {isPending ? <span className="text-sm text-(--muted)">Repurposing, up to a minute.</span> : null}
          {error ? <span className="text-sm text-(--red)">{error}</span> : null}
        </div>
      </div>
    </div>
  );
}
