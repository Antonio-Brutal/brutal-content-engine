"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runAdhocAction } from "@/app/studio/actions";
import type { EngineType } from "@/lib/engines/prompts";

// The à-la-carte generator. Engine options arrive as props from the server
// component so the prompts module (and its db import chain) stays server-only.
export function StudioComposer({
  options,
  initialType,
}: {
  options: { value: EngineType; label: string }[];
  initialType: EngineType;
}) {
  const router = useRouter();
  const [type, setType] = useState<EngineType>(initialType);
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generate = () =>
    startTransition(async () => {
      setError(null);
      const result = await runAdhocAction(type, brief);
      if (result.ok) {
        router.push(`/studio/assets/${result.assetId}`);
      } else {
        setError(result.error ?? "Generation failed.");
      }
    });

  return (
    <div className="card p-5">
      <div className="grid gap-5">
        <div className="max-w-xs">
          <p className="label mb-2">Engine.</p>
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value as EngineType)}
            disabled={isPending}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="label mb-2">The closed world: every fact the piece may use.</p>
          <textarea
            className="textarea min-h-[260px] font-mono text-[13px]"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Paste facts, numbers, quotes, links. The engine may not invent beyond this, gaps come back as [MISSING] markers."
            spellCheck={false}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={generate}
            disabled={isPending || !brief.trim()}
          >
            Generate
          </button>
          {isPending ? <span className="text-sm text-(--muted)">Generating, up to a minute.</span> : null}
          {error ? <span className="text-sm text-(--red)">{error}</span> : null}
        </div>
      </div>
    </div>
  );
}
