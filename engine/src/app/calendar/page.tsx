import Link from "next/link";
import { Asset, Publication, Solution, getAsset, getSolution, listAllAssets, listPublicationsForAsset, recentPublications } from "@/db/repo";
import { ENGINE_LABELS, EngineType } from "@/lib/engines/prompts";
import { PLATFORMS } from "@/lib/engines/exports";
import { Card, EmptyState, PageTitle, SectionLabel } from "@/components/ui";
import { ExportButton } from "@/components/export-button";

export const dynamic = "force-dynamic";

// The chronological view of the pipeline's output: what went live, day by day,
// and what is approved but still sitting on the shelf.

function typeLabel(type: Asset["type"]) {
  return type === "solution" ? "Solution doc" : ENGINE_LABELS[type as EngineType] ?? type;
}

function platformLabel(platform: string) {
  return PLATFORMS[platform]?.label ?? platform;
}

function viewsOf(metricsJson: string | null): number | null {
  if (!metricsJson) return null;
  try {
    const v = JSON.parse(metricsJson)?.views;
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

type PublishedRow = {
  pub: Publication;
  asset: Asset | undefined;
  solution: Solution | undefined;
  views: number | null;
};

export default function CalendarPage() {
  // recentPublications returns live rows newest first; the limit just needs to
  // exceed anything a one-person pipeline produces.
  const published: PublishedRow[] = recentPublications(1000).map((pub) => {
    const asset = getAsset(pub.assetId);
    const solution = asset?.solutionId ? getSolution(asset.solutionId) : undefined;
    return { pub, asset, solution, views: viewsOf(pub.metricsJson) };
  });

  // group under date headings, order preserved (newest first)
  const byDate = new Map<string, PublishedRow[]>();
  for (const row of published) {
    const key = row.pub.publishedAt ? new Date(row.pub.publishedAt).toISOString().slice(0, 10) : "undated";
    const bucket = byDate.get(key);
    if (bucket) bucket.push(row);
    else byDate.set(key, [row]);
  }

  // approved assets with zero live publications, grouped so each solution's
  // export link appears once
  const seenSolutions = new Set<string>();
  const ready = listAllAssets()
    .filter((a) => a.status === "approved")
    .filter((a) => !listPublicationsForAsset(a.id).some((p) => p.status === "live"))
    .map((asset) => ({ asset, solution: asset.solutionId ? getSolution(asset.solutionId) : undefined }))
    .sort(
      (x, y) =>
        (x.solution?.title ?? "Studio").localeCompare(y.solution?.title ?? "Studio") ||
        x.asset.type.localeCompare(y.asset.type)
    )
    .map((row) => {
      const showExport = Boolean(row.asset.solutionId && !seenSolutions.has(row.asset.solutionId));
      if (row.asset.solutionId) seenSolutions.add(row.asset.solutionId);
      return { ...row, showExport };
    });

  return (
    <div>
      <PageTitle sub="Everything the engine has shipped, day by day, plus the approved assets still waiting for a live URL.">
        Calendar
      </PageTitle>

      <section>
        <SectionLabel>Published.</SectionLabel>
        {byDate.size === 0 ? (
          <EmptyState title="Nothing live yet.">
            <p>Publications land here once an asset is marked published with its live URL.</p>
          </EmptyState>
        ) : (
          <div className="grid gap-4">
            {Array.from(byDate.entries()).map(([date, rows]) => (
              <Card key={date}>
                <p className="label mb-3">{date}.</p>
                <div className="grid gap-3">
                  {rows.map((row) => (
                    <div
                      key={row.pub.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-(--line) pt-3 first:border-t-0 first:pt-0"
                    >
                      <span className="text-sm font-medium">{row.solution?.title ?? "Studio"}</span>
                      {row.asset ? <span className="label">{typeLabel(row.asset.type)}.</span> : null}
                      <span className="label">{platformLabel(row.pub.platform)}.</span>
                      {row.pub.url ? (
                        <a
                          href={row.pub.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-mono text-xs text-(--blue) underline underline-offset-4"
                        >
                          {row.pub.url.replace(/^https?:\/\//, "")}
                        </a>
                      ) : null}
                      {row.views !== null ? <span className="label">{row.views.toLocaleString("en-US")} views.</span> : null}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionLabel>Ready to ship.</SectionLabel>
        {ready.length === 0 ? (
          <EmptyState title="Nothing waiting.">
            <p>Approved assets without a live publication queue up here.</p>
          </EmptyState>
        ) : (
          <Card>
            <div className="grid gap-3">
              {ready.map(({ asset, solution, showExport }) => {
                const href = asset.solutionId
                  ? `/solutions/${asset.solutionId}/assets/${asset.id}`
                  : `/studio/assets/${asset.id}`;
                return (
                  <div
                    key={asset.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-(--line) pt-3 first:border-t-0 first:pt-0"
                  >
                    <span className="text-sm font-medium">{solution?.title ?? "Studio"}</span>
                    <span className="label">{typeLabel(asset.type)}.</span>
                    <Link href={href} className="btn">
                      Open
                    </Link>
                    {showExport && asset.solutionId ? <ExportButton solutionId={asset.solutionId} /> : null}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
