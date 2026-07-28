"use client";

import { ReactNode, useMemo, useState } from "react";
import { diffLines, type DiffLine } from "@/lib/diff";

// The versions sidebar plus Compare mode. This component owns the asset grid
// so the diff pane can render full-width under the asset while the selects
// live in the sidebar. Versions arrive serialized from the server page.

export type VersionRow = {
  id: string;
  version: number;
  author: string;
  createdAt: number;
  bodyMd: string;
};

type DiffRow = { kind: "line"; type: DiffLine["type"]; text: string } | { kind: "gap"; n: number };

/** Runs of unchanged lines longer than 6 collapse to a single marker row. */
function collapseSameRuns(lines: DiffLine[]): DiffRow[] {
  const out: DiffRow[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type !== "same") {
      out.push({ kind: "line", type: lines[i].type, text: lines[i].text });
      i++;
      continue;
    }
    let j = i;
    while (j < lines.length && lines[j].type === "same") j++;
    const run = j - i;
    if (run > 6) {
      out.push({ kind: "gap", n: run });
    } else {
      for (let k = i; k < j; k++) out.push({ kind: "line", type: "same", text: lines[k].text });
    }
    i = j;
  }
  return out;
}

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

const LINE_CLASS: Record<DiffLine["type"], string> = {
  add: "bg-[rgba(198,241,74,0.10)] text-(--text)",
  del: "bg-[rgba(255,107,94,0.10)] text-(--muted) line-through",
  same: "text-(--muted)",
};

export function VersionsPanel({ versions, children }: { versions: VersionRow[]; children: ReactNode }) {
  const [compare, setCompare] = useState(false);
  // newest-first list: default the comparison to previous version vs latest
  const [fromV, setFromV] = useState<number>(versions[1]?.version ?? versions[0]?.version ?? 0);
  const [toV, setToV] = useState<number>(versions[0]?.version ?? 0);

  const from = versions.find((v) => v.version === fromV);
  const to = versions.find((v) => v.version === toV);

  const rows = useMemo(() => {
    if (!compare || !from || !to) return [];
    return collapseSameRuns(diffLines(from.bodyMd, to.bodyMd));
  }, [compare, from, to]);

  return (
    <div className="mb-12">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">{children}</div>
        <div>
          <p className="label mb-3">Versions.</p>
          {versions.length === 0 ? (
            <p className="text-sm text-(--muted)">
              None yet. A version is written on each regenerate and each approval.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id}>
                  <details>
                    <summary className="cursor-pointer select-none font-mono text-xs text-(--muted)">
                      v{v.version} · {v.author} · {fmtDate(v.createdAt)}
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-(--line) bg-(--panel-2) p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-(--muted)">
                      {v.bodyMd}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
          {versions.length >= 2 ? (
            <div className="mt-4 border-t border-(--line) pt-4">
              <button type="button" className="btn" onClick={() => setCompare((c) => !c)}>
                {compare ? "Close compare" : "Compare"}
              </button>
              {compare ? (
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="label mb-1">From.</p>
                    <select className="select" value={fromV} onChange={(e) => setFromV(Number(e.target.value))}>
                      {versions.map((v) => (
                        <option key={v.id} value={v.version}>
                          v{v.version} · {v.author} · {fmtDate(v.createdAt)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label mb-1">To.</p>
                    <select className="select" value={toV} onChange={(e) => setToV(Number(e.target.value))}>
                      {versions.map((v) => (
                        <option key={v.id} value={v.version}>
                          v{v.version} · {v.author} · {fmtDate(v.createdAt)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {compare && from && to ? (
        <div className="card mt-4 p-5">
          <p className="label mb-3">
            Diff. v{from.version} to v{to.version}.
          </p>
          {from.version === to.version ? (
            <p className="text-sm text-(--muted)">Same version on both sides, nothing to diff.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-(--line) bg-(--panel-2) p-3 font-mono text-[11.5px] leading-relaxed">
              {rows.map((row, i) =>
                row.kind === "gap" ? (
                  <div key={i} className="select-none py-1 text-center text-(--muted)">
                    ... {row.n} unchanged lines ...
                  </div>
                ) : (
                  <div key={i} className={`whitespace-pre-wrap ${LINE_CLASS[row.type]}`}>
                    {row.text || " "}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
