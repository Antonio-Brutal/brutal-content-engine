"use client";

import { useRef, useState, useTransition } from "react";
import { Markdown } from "@/components/markdown";
import { approveStudioAssetAction, saveStudioBodyAction } from "@/app/studio/assets/[assetId]/actions";

// View/edit surface for a standalone asset. Saves update working state only;
// a human version is written on approval.
export function StudioAssetEditor({
  assetId,
  initialBody,
  approved,
}: {
  assetId: string;
  initialBody: string;
  approved: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(msg);
    flashTimer.current = setTimeout(() => setFlash(null), 2500);
  };

  const save = () =>
    startTransition(async () => {
      await saveStudioBodyAction(assetId, body);
      showFlash("Saved");
    });

  const approve = () =>
    startTransition(async () => {
      await approveStudioAssetAction(assetId, body);
      setEditing(false);
      showFlash(approved ? "New version approved" : "Approved");
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {editing ? (
          <>
            <button type="button" className="btn" onClick={save} disabled={isPending}>
              Save working copy
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
        <button type="button" className="btn btn-primary" onClick={approve} disabled={isPending || !body.trim()}>
          {approved ? "Approve new version" : "Approve"}
        </button>
        {flash ? <span className="text-sm text-(--lime)">{flash}</span> : null}
      </div>

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
      ) : body.trim() ? (
        <Markdown md={body} />
      ) : (
        <p className="text-sm text-(--muted)">No body yet, the generation may still be running, or it failed before a draft was written.</p>
      )}
    </div>
  );
}
