"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { approveAssetAction, regenerateAssetAction, saveAssetBodyAction } from "@/app/solutions/[id]/actions";
import { blogVariantsAction, editPassAction } from "@/components/review/actions";
import type { EngineType } from "@/lib/engines/prompts";

// Full asset view/edit surface. Saves are working state only; Approve writes
// the human version (and, for the blog, fans out the downstream engines in the
// same awaited action). Regenerate swaps in the fresh AI draft when it lands.
// Edit pass runs the copy-editing second pass; Variants (blog only) drafts two
// competing posts and lets the judge pick the working draft.
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
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"save" | "approve" | "regen" | "editpass" | "variants" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState<string | null>(null);
  const [judgeSummary, setJudgeSummary] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Server-side body changes (revalidation after an action elsewhere) land here
  // without a remount, so summaries and flashes survive. Local edits win while
  // the textarea is open.
  const [lastInitial, setLastInitial] = useState(initialBody);
  if (initialBody !== lastInitial) {
    setLastInitial(initialBody);
    if (!editing) setBody(initialBody);
  }

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

  const editPass = () => {
    setMode("editpass");
    setError(null);
    setEditSummary(null);
    startTransition(async () => {
      const result = await editPassAction(assetId, solutionId);
      if (result.ok) {
        if (result.bodyMd !== undefined) setBody(result.bodyMd);
        setEditing(false);
        setJustApproved(false);
        setEditSummary(result.summary ?? "Edited.");
        router.refresh();
      } else {
        setError(result.error ?? "The edit pass failed.");
      }
    });
  };

  const variants = () => {
    setMode("variants");
    setError(null);
    setJudgeSummary(null);
    startTransition(async () => {
      const result = await blogVariantsAction(solutionId, assetId);
      if (result.ok) {
        if (result.bodyMd !== undefined) setBody(result.bodyMd);
        setEditing(false);
        setJustApproved(false);
        setJudgeSummary(result.judgeSummary || "The judge picked a winner, it is the working draft below.");
        router.refresh();
      } else {
        setError(result.error ?? "The variants run failed.");
      }
    });
  };

  const approving = isPending && mode === "approve";
  const regenerating = isPending && mode === "regen";
  const editPassing = isPending && mode === "editpass";
  const drafting = isPending && mode === "variants";

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
        <button type="button" className="btn" onClick={editPass} disabled={isPending}>
          {editPassing ? "Edit pass running… (~60s)" : "Edit pass"}
        </button>
        {isBlog ? (
          <button type="button" className="btn" onClick={variants} disabled={isPending}>
            {drafting ? "Drafting 2 variants + judging… (~4 min, double cost)" : "Draft 2 variants + judge"}
          </button>
        ) : null}
        {flash ? <span className="text-sm text-(--lime)">{flash}</span> : null}
      </div>

      {approving && isBlog ? (
        <p className="mb-4 text-xs text-(--muted)">
          Approving the blog fans out the solutions page, tweet, LinkedIn, and case study, this can take 3+ minutes. Stay on the page.
        </p>
      ) : null}
      {drafting ? (
        <p className="mb-4 text-xs text-(--muted)">
          Two independent drafts plus a judge run: roughly 4 minutes and double the usual generation cost. Stay on the page.
        </p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-(--red)">{error}</p> : null}
      {editSummary && !isPending ? (
        <div className="mb-4 rounded-lg border border-(--line) bg-(--panel-2) p-3">
          <p className="label mb-2">Edit pass changes.</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-(--muted)">{editSummary}</p>
        </div>
      ) : null}
      {judgeSummary && !isPending ? (
        <div className="mb-4 rounded-lg border border-(--line) bg-(--panel-2) p-3">
          <p className="label mb-2">Judge verdict.</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-(--muted)">{judgeSummary}</p>
        </div>
      ) : null}
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
