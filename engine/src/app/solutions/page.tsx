import Link from "next/link";
import { listAssetsForSolution, listSolutions } from "@/db/repo";
import { EmptyState, PageTitle, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

// Campaign = 6 assets: solution doc + blog + page + tweet + linkedin + case study.
// Phase 1 only produces the doc; downstream engines land in Phase 2.
const CAMPAIGN_SIZE = 6;

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export default function SolutionsPage() {
  const solutions = listSolutions();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageTitle sub="Every solution Brutal has documented. Each one is the root of a campaign, the doc first, the downstream assets in Phase 2.">
          Solutions
        </PageTitle>
        <Link href="/solutions/new" className="btn btn-primary mt-1 shrink-0">
          New solution
        </Link>
      </div>

      {solutions.length === 0 ? (
        <EmptyState title="No solutions yet.">
          <p>
            Start in{" "}
            <Link href="/solutions/new" className="text-(--lime) underline underline-offset-4">
              New solution
            </Link>
            : info-dump what Brutal built, answer the interviewer, and the doc drafts itself. Everything downstream generates from that doc.
          </p>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((s) => {
            const assetCount = listAssetsForSolution(s.id).filter((a) => a.bodyMd.trim().length > 0).length;
            return (
              <Link
                key={s.id}
                href={`/solutions/${s.id}`}
                className="card flex flex-col gap-4 p-5 transition-colors hover:border-(--line-strong)"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug">{s.title}</p>
                  <StatusPill status={s.status === "published" ? "published" : "draft"} />
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="label">Updated {fmtDate(s.updatedAt)}.</span>
                  <span className="font-mono text-xs tabular-nums text-(--muted)">
                    {assetCount}/{CAMPAIGN_SIZE} assets
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
