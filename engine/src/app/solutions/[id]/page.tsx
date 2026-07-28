import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ensureSolutionDocAsset,
  getAsset,
  getSolution,
  listAssetsForSolution,
  listJobs,
  listMediaForSolution,
  listVersions,
} from "@/db/repo";
import { Card, EmptyState, SectionLabel, StatusPill } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { ExportButton } from "@/components/export-button";
import { BoardDocEditor } from "@/components/board/doc-editor";
import { BoardColumn } from "@/components/board/column";
import { AttachClientCard } from "@/components/clients/attach-card";
import type { EngineType } from "@/lib/engines/prompts";

export const dynamic = "force-dynamic";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

// The five downstream engines, one review-board column each.
const BOARD: EngineType[] = ["blog", "page", "tweet", "linkedin", "case_study"];

export default async function SolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const solution = getSolution(id);
  if (!solution) notFound();

  // The solution doc is the root node of the content graph, make sure the edge exists.
  const docRef = ensureSolutionDocAsset(id);
  const doc = getAsset(docRef.id)!;
  const hasBody = doc.bodyMd.trim().length > 0;
  const versions = listVersions(doc.id);
  const media = listMediaForSolution(id);
  const assets = listAssetsForSolution(id);
  const jobs = listJobs(200);
  const links = (solution.links ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Latest job error per asset (jobs come back newest-first).
  const latestJobError = (assetId: string) => jobs.find((j) => j.assetId === assetId)?.error ?? null;

  // While anything on the board is generating, the page polls itself.
  const anyAssetGenerating = assets.some((a) => a.status === "generating");

  return (
    <div>
      <AutoRefresh active={anyAssetGenerating} />
      <div className="mb-10">
        <Link href="/solutions" className="label transition-colors hover:text-(--text)">
          All solutions.
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-medium tracking-[-0.02em]">{solution.title}</h1>
          <StatusPill status={solution.status === "published" ? "published" : "draft"} />
          <ExportButton solutionId={id} />
        </div>
        <p className="label mt-3">
          Created {fmtDate(solution.createdAt)} · updated {fmtDate(solution.updatedAt)}.
        </p>
      </div>

      <SectionLabel>Solution doc.</SectionLabel>
      <div className="mb-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        {hasBody ? (
          <Card>
            <BoardDocEditor
              key={doc.updatedAt}
              solutionId={solution.id}
              assetId={doc.id}
              initialBody={doc.bodyMd}
              approved={doc.status === "approved"}
            />
          </Card>
        ) : (
          <EmptyState title="No doc yet.">
            <p>
              The solution doc gets drafted in the builder, info dump, interview, draft.{" "}
              <Link href={`/solutions/new?solutionId=${solution.id}`} className="text-(--lime) underline underline-offset-4">
                Open the builder
              </Link>
              . Once it exists, edit and approve it here, approving auto-drafts the blog.
            </p>
          </EmptyState>
        )}
        <div>
          <p className="label mb-3">Versions.</p>
          {versions.length === 0 ? (
            <p className="text-sm text-(--muted)">
              None yet. A version is written when the doc is drafted and each time you approve.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="font-mono text-xs text-(--muted)">
                  v{v.version} · {v.author} · {fmtDate(v.createdAt)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SectionLabel>Review board.</SectionLabel>
      <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {BOARD.map((type) => {
          const asset = assets.find((a) => a.type === type);
          return (
            <BoardColumn
              key={type}
              type={type}
              solutionId={solution.id}
              asset={asset}
              jobError={asset ? latestJobError(asset.id) : null}
              hasClient={!!solution.clientId}
            />
          );
        })}
      </div>

      <SectionLabel>Client.</SectionLabel>
      <div className="mb-12 max-w-xl">
        <AttachClientCard solutionId={id} clientId={solution.clientId} />
      </div>

      <SectionLabel>Media.</SectionLabel>
      <div className="mb-12">
        {media.length === 0 ? (
          <p className="text-sm text-(--muted)">No media attached. Uploads happen in the builder.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {media.map((m) => (
              <figure key={m.id} className="card w-44 overflow-hidden">
                {m.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${m.id}`}
                    alt={m.alt ?? m.kind}
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center bg-(--panel-2) font-mono text-[10px] text-(--muted)">
                    {m.mime}
                  </div>
                )}
                <figcaption className="px-3 py-2">
                  <span className="label">{m.kind}.</span>
                  {m.alt ? <p className="mt-1 truncate text-xs text-(--muted)">{m.alt}</p> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {solution.dumpRaw || links.length > 0 ? (
        <details className="card p-5">
          <summary className="label cursor-pointer select-none">Info dump.</summary>
          <div className="mt-4 space-y-5">
            {solution.dumpRaw ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-(--muted)">
                {solution.dumpRaw}
              </pre>
            ) : null}
            {links.length > 0 ? (
              <div>
                <p className="label mb-2">Links.</p>
                <ul className="space-y-1">
                  {links.map((l, i) => (
                    <li key={i} className="truncate font-mono text-xs text-(--muted)">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}
