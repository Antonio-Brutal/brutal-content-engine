import Link from "next/link";
import {
  costThisMonth,
  getAsset,
  getSolutionDocAsset,
  listAllAssets,
  listAssetsForSolution,
  listSolutions,
  recentPublications,
  type Asset,
} from "@/db/repo";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";
import { PLATFORMS } from "@/lib/engines/exports";
import { Card, EmptyState, PageTitle, SectionLabel, StatusPill } from "@/components/ui";
import { parseMetrics } from "@/components/metrics/types";

export const dynamic = "force-dynamic";

// The morning-coffee screen: every pipeline, every problem, every live URL, one glance.

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

// Fixed pill order for the pipeline rows: doc first, then the five engines.
const PIPELINE: { type: Asset["type"]; label: string }[] = [
  { type: "solution", label: "Doc." },
  { type: "blog", label: "Blog." },
  { type: "page", label: "Page." },
  { type: "tweet", label: "Tweet." },
  { type: "linkedin", label: "LinkedIn." },
  { type: "case_study", label: "Case." },
];

export default function CommandCenter() {
  const solutions = listSolutions();
  const solutionById = new Map(solutions.map((s) => [s.id, s]));
  const publishedCount = solutions.filter((s) => s.status === "published").length;

  // Engine output only, the solution doc's lifecycle is tracked by the solution itself.
  const engineAssets = listAllAssets().filter((a) => a.type !== "solution");
  const awaiting = engineAssets.filter((a) => a.status === "draft").length;
  const stale = engineAssets.filter((a) => a.status === "stale").length;
  const failed = engineAssets.filter((a) => a.status === "failed").length;
  const blocked = engineAssets.filter((a) => a.status === "blocked").length;

  // Month budget: this month's generation spend against BUDGET_MONTHLY_USD.
  const monthCost = costThisMonth();
  const budgetEnv = Number(process.env.BUDGET_MONTHLY_USD);
  const budget = Number.isFinite(budgetEnv) && budgetEnv > 0 ? budgetEnv : 50;
  const budgetRatio = monthCost / budget;
  const budgetBarClass = budgetRatio < 0.8 ? "bg-(--lime)" : budgetRatio < 1 ? "bg-(--amber)" : "bg-(--red)";
  const budgetBarPct = Math.min(100, budgetRatio * 100);

  const attention = engineAssets
    .filter((a) => (a.status === "failed" || a.status === "stale" || a.status === "draft") && a.solutionId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

  const recent = recentPublications().flatMap((p) => {
    if (!p.url) return [];
    const asset = getAsset(p.assetId);
    const solution = asset?.solutionId ? solutionById.get(asset.solutionId) : undefined;
    return [
      {
        id: p.id,
        url: p.url,
        publishedAt: p.publishedAt,
        platformLabel: PLATFORMS[p.platform]?.label ?? p.platform,
        solutionTitle: solution?.title ?? "Studio",
        views: parseMetrics(p.metricsJson)?.views ?? null,
      },
    ];
  });

  // One pipeline row per solution: the doc from its dedicated lookup, engines from
  // the asset list, earliest asset of each type is the pipeline one (repurposes
  // create newer duplicates by design).
  const pipelines = solutions.map((s) => {
    const assets = listAssetsForSolution(s.id);
    const doc = getSolutionDocAsset(s.id);
    const byType = new Map<Asset["type"], Asset>();
    if (doc) byType.set("solution", doc);
    for (const a of [...assets].sort((x, y) => x.createdAt - y.createdAt)) {
      if (a.type !== "solution" && !byType.has(a.type)) byType.set(a.type, a);
    }
    return { solution: s, byType };
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
        <PageTitle sub="Every pipeline at a glance, what is waiting on you, what went stale, what is live.">
          Command center
        </PageTitle>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link href="/solutions/new" className="btn btn-primary">
            New solution
          </Link>
          <Link href="/studio" className="btn">
            Studio
          </Link>
          <Link href="/repurpose" className="btn">
            Repurpose
          </Link>
        </div>
      </div>

      <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <p className="text-2xl font-medium tabular-nums">
            {solutions.length}
            <span className="text-(--muted)"> / {publishedCount}</span>
          </p>
          <p className="label mt-1">Solutions / published.</p>
        </Card>
        <Card>
          <p className="text-2xl font-medium tabular-nums">{awaiting}</p>
          <p className="label mt-1">Awaiting review.</p>
        </Card>
        <Card>
          <p className={`text-2xl font-medium tabular-nums ${stale > 0 ? "text-(--amber)" : ""}`}>{stale}</p>
          <p className="label mt-1">Stale.</p>
        </Card>
        <Card>
          <p className={`text-2xl font-medium tabular-nums ${failed > 0 ? "text-(--red)" : ""}`}>{failed}</p>
          <p className="label mt-1">Failed.</p>
        </Card>
        <Card>
          <p className={`text-2xl font-medium tabular-nums ${blocked > 0 ? "text-(--amber)" : ""}`}>{blocked}</p>
          <p className="label mt-1">Blocked on clients.</p>
        </Card>
        <Card>
          <p className="text-2xl font-medium tabular-nums">
            ${monthCost.toFixed(2)}
            <span className="text-sm text-(--muted)"> of ${budget}</span>
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-(--panel-2)">
            <div className={`h-full rounded-full ${budgetBarClass}`} style={{ width: `${budgetBarPct}%` }} />
          </div>
          <p className="label mt-2">Month budget.</p>
        </Card>
      </div>

      <SectionLabel>Pipelines.</SectionLabel>
      <div className="mb-12">
        {pipelines.length === 0 ? (
          <EmptyState title="No solutions yet.">
            <p>
              Start with{" "}
              <Link href="/solutions/new" className="text-(--lime) underline underline-offset-4">
                New solution
              </Link>{" "}
             , info-dump what Brutal built, let the interviewer pull the story out of you, publish, and the
              pipeline takes it from there.
            </p>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[minmax(200px,1fr)_repeat(6,96px)] gap-x-3 px-4 pb-2">
                <p className="label">Solution.</p>
                {PIPELINE.map((col) => (
                  <p key={col.type} className="label">
                    {col.label}
                  </p>
                ))}
              </div>
              <div className="grid gap-2">
                {pipelines.map(({ solution, byType }) => (
                  <div
                    key={solution.id}
                    className="card grid grid-cols-[minmax(200px,1fr)_repeat(6,96px)] items-center gap-x-3 px-4 py-3"
                  >
                    <Link
                      href={`/solutions/${solution.id}`}
                      className="truncate font-medium underline-offset-4 hover:underline"
                    >
                      {solution.title}
                    </Link>
                    {PIPELINE.map((col) => {
                      const asset = byType.get(col.type);
                      return asset ? (
                        <span key={col.type}>
                          <StatusPill status={asset.status} />
                        </span>
                      ) : (
                        <span key={col.type} className="font-mono text-xs text-(--muted)">
                          -
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <SectionLabel>Needs attention.</SectionLabel>
          {attention.length === 0 ? (
            <p className="text-sm text-(--muted)">Clear. Nothing failed, nothing stale, nothing waiting on review.</p>
          ) : (
            <div className="grid gap-2">
              {attention.map((a) => (
                <Link
                  key={a.id}
                  href={`/solutions/${a.solutionId}/assets/${a.id}`}
                  className="card flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:border-(--line-strong)"
                >
                  <span className="min-w-0 truncate text-sm">
                    <span className="font-medium">{solutionById.get(a.solutionId!)?.title ?? "Unknown solution"}</span>
                    <span className="text-(--muted)">, {ENGINE_LABELS[a.type as EngineType]}</span>
                  </span>
                  <StatusPill status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionLabel>Recently published.</SectionLabel>
          {recent.length === 0 ? (
            <p className="text-sm text-(--muted)">
              Nothing live yet. Approve an asset, publish it to a platform, and the URL lands here.
            </p>
          ) : (
            <div className="grid gap-2">
              {recent.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:border-(--line-strong)"
                >
                  <span className="min-w-0 truncate text-sm">
                    <span className="font-medium">{r.solutionTitle}</span>
                    <span className="text-(--muted)">, {r.platformLabel}</span>
                    {r.views != null ? <span className="text-(--muted)"> · {r.views} views</span> : null}
                  </span>
                  {r.publishedAt ? (
                    <span className="shrink-0 font-mono text-xs text-(--muted)">{fmtDate(r.publishedAt)}</span>
                  ) : null}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
