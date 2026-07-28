"use client";

import { useRef, useState } from "react";

type MediaRow = { id: string; mime: string; alt: string | null };

// Small on-brand image generator. POSTs to /api/images/generate; a 400 means
// the image key is absent, a designed state, the error line shows verbatim.
export function ImageGenerator({ solutionId }: { solutionId: string }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MediaRow | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, solutionId }),
      });
      const json = (await res.json().catch(() => null)) as (MediaRow & { error?: string }) | null;
      if (!res.ok || !json || !json.id) {
        setError(json?.error ?? `Image generation failed (${res.status}).`);
        return;
      }
      setResult(json);
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const copyRef = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`media://${result.id}`);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Clipboard write failed, click the page and try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-md"
          placeholder="What the image must show"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") generate();
          }}
          disabled={busy}
        />
        <button type="button" className="btn" onClick={generate} disabled={busy || !prompt.trim()}>
          {busy ? "Generating…" : "Generate image"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-(--amber)">{error}</p> : null}

      {result ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/${result.id}`}
            alt={result.alt ?? "Generated image"}
            className="max-h-72 w-auto max-w-full rounded-lg border border-(--line)"
          />
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-(--panel-2) px-2 py-1 font-mono text-xs">media://{result.id}</code>
            <button type="button" className="btn" onClick={copyRef}>
              {copied ? "Copied" : "Copy reference"}
            </button>
          </div>
          <p className="text-xs text-(--muted)">
            Saved to the media library, reference it from any asset body as media://{result.id}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
