"use client";

import { useRef, useState, useTransition } from "react";
import { Markdown } from "@/components/markdown";
import { publishAndDraftBlogAction, saveWorkingBodyAction } from "@/app/solutions/[id]/actions";

// View/edit surface for the solution doc. Saves update working state only; a
// version is written on approval. Publishing is stage one of the fan-out: it
// approves the doc AND auto-drafts the blog in the same awaited server action.
export function BoardDocEditor({
  solutionId,
  assetId,
  initialBody,
  approved,
}: {
  solutionId: string;
  assetId: string;
  initialBody: string;
  approved: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"save" | "publish" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(msg);
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  };

  const save = () => {
    setMode("save");
    setError(null);
    startTransition(async () => {
      await saveWorkingBodyAction(assetId, solutionId, body);
      showFlash("Saved");
    });
  };

  const publish = () => {
    setMode("publish");
    setError(null);
    startTransition(async () => {
      const result = await publishAndDraftBlogAction(solutionId, assetId, body);
      setEditing(false);
      if (result.ok) {
        showFlash(approved ? "New version approved, blog redrafted" : "Published, blog drafted");
      } else {
        setError(`Doc approved, but the blog draft failed: ${result.error ?? "unknown error"}. Retry from the board.`);
      }
    });
  };

  const publishing = isPending && mode === "publish";

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
        <button type="button" className="btn btn-primary" onClick={publish} disabled={isPending}>
          {publishing ? "Blog drafting…" : approved ? "Approve new version" : "Publish + draft blog"}
        </button>
        {flash ? <span className="text-sm text-(--lime)">{flash}</span> : null}
      </div>

      {publishing ? (
        <p className="mb-4 text-xs text-(--muted)">
          Approving the doc and drafting the blog from it, this takes about a minute. Stay on the page.
        </p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-(--red)">{error}</p> : null}

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
