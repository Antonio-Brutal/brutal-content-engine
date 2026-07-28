import Link from "next/link";
import type { Asset } from "@/db/repo";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";
import { StatusPill } from "@/components/ui";
import { RunEngineButton } from "./run-engine-button";

// One review-board column per downstream engine. Server component, all state
// comes from the DB; the only interactivity is the run button.

function excerpt(md: string, maxWords = 40) {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ").filter(Boolean);
  return words.slice(0, maxWords).join(" ") + (words.length > maxWords ? " …" : "");
}

export function BoardColumn({
  type,
  solutionId,
  asset,
  jobError,
  hasClient,
}: {
  type: EngineType;
  solutionId: string;
  asset: Asset | undefined;
  jobError: string | null;
  hasClient: boolean;
}) {
  // An asset row in "draft" with an empty body is the transient shell runEngine
  // creates before its first run, treat it like a missing asset.
  const missing = !asset || (asset.status === "draft" && !asset.bodyMd.trim());

  return (
    <div className="card flex min-h-44 flex-col gap-3 p-4">
      <p className="label">{ENGINE_LABELS[type]}.</p>

      {missing ? (
        type === "blog" ? (
          <>
            <RunEngineButton type="blog" solutionId={solutionId} label="Generate blog" pendingLabel="Drafting… (~60s)" tone="primary" />
            <p className="text-xs text-(--muted)">Runs from the approved solution doc.</p>
          </>
        ) : type === "case_study" && !hasClient ? (
          <>
            <div>
              <StatusPill status="blocked" />
            </div>
            <p className="text-xs text-(--muted)">Waiting on client record. Attach a client below to unblock the case study.</p>
          </>
        ) : (
          <p className="text-xs text-(--muted)">Generates when the blog is approved.</p>
        )
      ) : (
        <ColumnBody type={type} solutionId={solutionId} asset={asset!} jobError={jobError} hasClient={hasClient} />
      )}
    </div>
  );
}

function ColumnBody({
  type,
  solutionId,
  asset,
  jobError,
  hasClient,
}: {
  type: EngineType;
  solutionId: string;
  asset: Asset;
  jobError: string | null;
  hasClient: boolean;
}) {
  if (asset.status === "blocked") {
    return (
      <>
        <div>
          <StatusPill status="blocked" />
        </div>
        <p className="text-xs text-(--muted)">Blocked: no client record attached. Attach a client below to unblock.</p>
        {hasClient ? (
          <RunEngineButton type={type} solutionId={solutionId} label="Generate case study" pendingLabel="Drafting… (~60s)" />
        ) : null}
      </>
    );
  }

  if (asset.status === "generating") {
    // Escape hatch: a server restart mid-run leaves the asset wedged in
    // "generating" forever. Pages are force-dynamic, so this staleness check
    // runs per request.
    const wedged = Date.now() - asset.updatedAt > 3 * 60 * 1000;
    return (
      <>
        <div>
          <StatusPill status="generating" />
        </div>
        <p className="text-xs text-(--muted)">Working… Reload the page to see the result.</p>
        {wedged ? (
          <RunEngineButton
            type={type}
            solutionId={solutionId}
            label="Taking too long? Regenerate"
            pendingLabel="Regenerating…"
            tone="amber"
          />
        ) : null}
      </>
    );
  }

  if (asset.status === "failed") {
    return (
      <>
        <div>
          <StatusPill status="failed" />
        </div>
        <p className="text-xs text-(--red)">{jobError ?? "Generation failed."}</p>
        <RunEngineButton type={type} solutionId={solutionId} label="Retry" pendingLabel="Retrying…" />
      </>
    );
  }

  // draft | stale | approved
  return (
    <>
      <div>
        <StatusPill status={asset.status} />
      </div>
      <p className="text-xs leading-relaxed text-(--muted)">{excerpt(asset.bodyMd)}</p>
      <div className="mt-auto flex flex-col items-start gap-2 pt-1">
        <Link
          href={`/solutions/${solutionId}/assets/${asset.id}`}
          className="text-sm text-(--lime) underline underline-offset-4"
        >
          Open
        </Link>
        {asset.status === "stale" ? (
          <RunEngineButton
            type={type}
            solutionId={solutionId}
            label="Upstream changed, regenerate from new version"
            pendingLabel="Regenerating…"
            tone="amber"
          />
        ) : null}
      </div>
    </>
  );
}
