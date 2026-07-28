"use client";

import { useState, useTransition } from "react";
import { suggestTopicsAction } from "@/app/blog/actions";
import { Markdown } from "@/components/markdown";

// The topic planner card on /blog. Suggestions are ephemeral: rendered, copyable, never saved.
export function TopicPlanner() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const suggest = () =>
    startTransition(async () => {
      setError(null);
      setCopied(false);
      const result = await suggestTopicsAction();
      if (result.ok && result.markdown) {
        setMarkdown(result.markdown);
      } else {
        setError(result.error ?? "The planner returned nothing, try again.");
      }
    });

  const copy = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed, select the text manually.");
    }
  };

  return (
    <div className="card mb-8 p-5">
      <p className="label mb-2">Plan next topics.</p>
      <p className="max-w-2xl text-sm text-(--muted)">
        Five proposals grounded in the published solutions and what the blog already covers. Nothing is saved, copy what you want to keep.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-primary" onClick={suggest} disabled={isPending}>
          {markdown ? "Suggest 5 more" : "Suggest 5 topics"}
        </button>
        {isPending ? <span className="text-sm text-(--muted)">Planning, up to half a minute.</span> : null}
        {markdown && !isPending ? (
          <button type="button" className="btn" onClick={copy}>
            {copied ? "Copied." : "Copy"}
          </button>
        ) : null}
        {error && !isPending ? <span className="text-sm text-(--red)">{error}</span> : null}
      </div>
      {markdown && !isPending ? <Markdown md={markdown} className="mt-5" /> : null}
    </div>
  );
}
