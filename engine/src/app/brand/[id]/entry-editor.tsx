"use client";

import { useState, useTransition } from "react";
import { Markdown } from "@/components/markdown";
import { saveContent } from "../actions";

export function EntryEditor({ entryId, contentMd }: { entryId: string; contentMd: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(contentMd);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="label">Content.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setDraft(contentMd);
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
        <Markdown md={contentMd} />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <p className="label mb-4">Content.</p>
      <textarea
        className="textarea font-mono text-[13px] leading-relaxed"
        rows={22}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={pending}
      />
      <p className="mt-2 text-xs text-(--muted)">Saving a content change bumps the version.</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveContent(entryId, draft);
              setEditing(false);
            })
          }
        >
          {pending ? "Saving" : "Save"}
        </button>
        <button type="button" className="btn" disabled={pending} onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
