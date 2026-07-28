"use client";

import { useRef, useState, useTransition } from "react";
import { formatForPlatformAction, markPublishedAction } from "@/app/solutions/[id]/actions";

const LOCKED_NOTE = "Approved, awaiting upstream URLs, mark the blog/page published first.";

// Publish & export: per-platform clipboard copy (formatted server-side at copy
// time) and mark-published forms whose URLs resolve the {{blog_url}}/{{page_url}}
// tokens. Copy stays locked while the asset carries unresolved tokens.
export function ExportPanel({
  assetId,
  solutionId,
  platforms,
  locked,
  publications,
}: {
  assetId: string;
  solutionId: string;
  platforms: { key: string; label: string }[];
  locked: string[];
  publications: { platform: string; url: string | null }[];
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(msg);
    flashTimer.current = setTimeout(() => setFlash(null), 3000);
  };

  const isLocked = locked.length > 0;

  const copy = (platform: string, label: string) => {
    setError(null);
    startTransition(async () => {
      const result = await formatForPlatformAction(assetId, platform);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        await navigator.clipboard.writeText(result.text);
        showFlash(`Copied for ${label}`);
      } catch {
        setError("Clipboard write failed, click the page and try again.");
      }
    });
  };

  const savePublished = (platform: string) => {
    const url = (urls[platform] ?? "").trim();
    if (!url) {
      setError("A live URL is required to mark published.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await markPublishedAction(assetId, solutionId, platform, url);
      if (!result.ok) {
        setError(result.error ?? "Could not mark published.");
        return;
      }
      setUrls((u) => ({ ...u, [platform]: "" }));
      showFlash("Marked published");
    });
  };

  return (
    <div className="space-y-5">
      {isLocked ? (
        <p className="text-xs text-(--amber)">
          {LOCKED_NOTE} Unresolved: {locked.join(", ")}.
        </p>
      ) : null}
      {flash ? <p className="text-sm text-(--lime)">{flash}</p> : null}
      {error ? <p className="text-sm text-(--red)">{error}</p> : null}

      {platforms.map((p) => {
        const live = publications.find((pub) => pub.platform === p.key);
        return (
          <div key={p.key} className="border-t border-(--line) pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="label">{p.label}.</span>
              {live?.url ? (
                <a
                  href={live.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-mono text-xs text-(--blue) underline underline-offset-4"
                >
                  {live.url}
                </a>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-wider text-(--muted)">not live</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => copy(p.key, p.label)}
                disabled={isLocked || isPending}
                title={isLocked ? LOCKED_NOTE : `Format for ${p.label} and copy to the clipboard`}
              >
                Copy for {p.label}
              </button>
              <input
                className="input max-w-xs"
                placeholder="https:// live URL"
                value={urls[p.key] ?? ""}
                onChange={(e) => setUrls((u) => ({ ...u, [p.key]: e.target.value }))}
                disabled={isPending}
              />
              <button type="button" className="btn" onClick={() => savePublished(p.key)} disabled={isPending}>
                Mark published
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
