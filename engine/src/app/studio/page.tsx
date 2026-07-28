import Link from "next/link";
import { listAllAssets } from "@/db/repo";
import { getProvider } from "@/lib/llm";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";
import { EmptyState, PageTitle, SectionLabel, StatusPill } from "@/components/ui";
import { StudioComposer } from "@/components/studio/composer";
import { excerpt } from "@/components/studio/excerpt";

export const dynamic = "force-dynamic";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function typeLabel(type: string) {
  return type in ENGINE_LABELS ? ENGINE_LABELS[type as EngineType] : "Solution doc";
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const options = (Object.entries(ENGINE_LABELS) as [EngineType, string][]).map(([value, label]) => ({ value, label }));
  const initialType: EngineType = type && type in ENGINE_LABELS ? (type as EngineType) : "blog";
  const configError = getProvider().configError();

  const standalone = listAllAssets()
    .filter((a) => a.solutionId === null)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle sub="À-la-carte generation. One engine, one ad-hoc brief, no solution attached, the brief you paste is the entire closed world the piece may draw from.">
        Studio
      </PageTitle>

      {configError ? (
        <div className="card mb-8 border-[rgba(245,166,35,0.5)] p-4">
          <p className="label mb-1 text-(--amber)">Provider not configured.</p>
          <p className="text-sm text-(--amber)">{configError}</p>
        </div>
      ) : null}

      <div className="mb-12">
        <StudioComposer options={options} initialType={initialType} />
      </div>

      <SectionLabel>Standalone assets.</SectionLabel>
      {standalone.length === 0 ? (
        <EmptyState title="Nothing generated yet.">
          <p>Pick an engine, paste a brief, hit Generate. Standalone assets live here, outside any solution.</p>
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {standalone.map((a) => (
            <Link key={a.id} href={`/studio/assets/${a.id}`} className="card block p-4 transition-colors hover:border-(--line-strong)">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-sm font-medium">{typeLabel(a.type)}</span>
                  <StatusPill status={a.status} />
                </div>
                <span className="label shrink-0">{fmtDate(a.createdAt)}.</span>
              </div>
              <p className="mt-2 truncate text-sm text-(--muted)">{excerpt(a.bodyMd)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
