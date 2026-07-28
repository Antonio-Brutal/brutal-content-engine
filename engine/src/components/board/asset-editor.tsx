"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { approveAssetAction, regenerateAssetAction, saveAssetBodyAction } from "@/app/solutions/[id]/actions";
import type { EngineType } from "@/lib/engines/prompts";

// Full asset view/edit surface. Saves are working state only; Approve writes
// the human version (and, for the blog, fans out the downstream engines in the
// same awaited action). Regenerate swaps in the fresh AI draft when it lands.
export function AssetEditor({
  assetId,
  solutionId,
  type,
  initialBody,
  approved,
}: {
  assetId: string;
  solutionId: string;
  type: EngineType;
  initialBody: string;
  approved: boolean;
}) {
  const isBlog = type === "blog";
  const [body, setBody] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"save" | "approve" | "regen" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(msg);
    flashTimer.current = setTimeout(() => setFlash(null), 6000);
  };

  const save = () => {
    setMode("save");
    setError(null);
    startTransition(async () => {
      await saveAssetBodyAction(assetId, solutionId, body);
      showFlash("Saved");
    });
  };

  const approve = () => {
    setMode("approve");
    setError(null);
    startTransition(async () => {
      const result = await approveAssetAction(assetId, solutionId, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setJustApproved(true);
      const failed = result.fanned.filter((f) => !f.ok);
      if (isBlog && result.fanned.length) {
        showFlash(
          failed.length
            ? `Approved v${result.version}, fan-out ran, ${failed.length} of ${result.fanned.length} runs need attention on the board`
            : `Approved v${result.version}, downstream drafts generated`
        );
      } else {
        showFlash(`Approved v${result.version}`);
      }
    });
  };

  const regenerate = () => {
    setMode("regen");
    setError(null);
    startTransition(async () => {
      const result = await regenerateAssetAction(type, solutionId);
      if (result.ok && result.bodyMd !== undefined) {
        setBody(result.bodyMd);
        setEditing(false);
        setJustApproved(false);
        showFlash("Regenerated, fresh AI draft below");
      } else {
        setError(result.error ?? "Regeneration failed.");
      }
    });
  };

  const approving = isPending && mode === "approve";
  const regenerating = isPending && mode === "regen";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {editing ? (
          <>
            <button type="button" className="btn" onClick={save} disabled={isPending}>
              {isPending && mode === "save" ? "Saving…" : "Save working copy"}
            </button>
            <button type="button" className="btn" onClick={() => setEditing(false)} disabled={isPending}>
              Done
            </button>
          </>
        ) : (
          <button type="button" className="btn" onClick={() => setEditing(true)} disabled={isPending}>
            Edit
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={approve} disabled={isPending}>
          {approving
            ? isBlog
              ? "Approving + fanning out…"
              : "Approving…"
            : approved
              ? "Approve new version"
              : "Approve"}
        </button>
        <button type="button" className="btn" onClick={regenerate} disabled={isPending}>
          {regenerating ? "Regenerating… (~60s)" : "Regenerate"}
        </button>
        {flash ? <span className="text-sm text-(--lime)">{flash}</span> : null}
      </div>

      {approving && isBlog ? (
        <p className="mb-4 text-xs text-(--muted)">
          Approving the blog fans out the solutions page, tweet, LinkedIn, and case study, this can take 3+ minutes. Stay on the page.
        </p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-(--red)">{error}</p> : null}
      {justApproved && !isPending ? (
        <p className="mb-4 text-sm">
          <Link href={`/solutions/${solutionId}`} className="text-(--lime) underline underline-offset-4">
            Back to the board
          </Link>
        </p>
      ) : null}

      {editing ? (
        <>
          <textarea
            className="textarea min-h-[420px] font-mono text-[13px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
          />
          <p className="label mt-3">Working copy, no version written until you approve.</p>
        </>
      ) : (
        <Markdown md={body} />
      )}
    </div>
  );
}
