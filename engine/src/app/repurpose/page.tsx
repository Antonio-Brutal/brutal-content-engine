import { listAllAssets, listAssetsForSolution, listSolutions } from "@/db/repo";
import { getProvider } from "@/lib/llm";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";
import { EmptyState, PageTitle } from "@/components/ui";
import { RepurposePicker, type SourceGroup } from "@/components/studio/repurpose-picker";
import { excerpt } from "@/components/studio/excerpt";

export const dynamic = "force-dynamic";

function typeLabel(type: string) {
  return type in ENGINE_LABELS ? ENGINE_LABELS[type as EngineType] : "Solution doc";
}

export default async function RepurposePage() {
  const configError = getProvider().configError();

  const groups: SourceGroup[] = [];
  for (const solution of listSolutions()) {
    const assets = listAssetsForSolution(solution.id).filter((a) => a.bodyMd.trim().length > 0);
    if (!assets.length) continue;
    groups.push({
      label: solution.title,
      options: assets.map((a) => ({ id: a.id, label: `${typeLabel(a.type)}, ${excerpt(a.bodyMd, 60)}` })),
    });
  }
  const standalone = listAllAssets()
    .filter((a) => a.solutionId === null && a.bodyMd.trim().length > 0)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (standalone.length) {
    groups.push({
      label: "Standalone.",
      options: standalone.map((a) => ({ id: a.id, label: `${typeLabel(a.type)}, ${excerpt(a.bodyMd, 60)}` })),
    });
  }

  const targets = (Object.entries(ENGINE_LABELS) as [EngineType, string][]).map(([value, label]) => ({ value, label }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle sub="Recast any existing asset into any format. The source asset is the entire brief, same closed world, new shape.">
        Repurpose
      </PageTitle>

      {configError ? (
        <div className="card mb-8 border-[rgba(245,166,35,0.5)] p-4">
          <p className="label mb-1 text-(--amber)">Provider not configured.</p>
          <p className="text-sm text-(--amber)">{configError}</p>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState title="No source material yet.">
          <p>Repurposing needs at least one asset with a body, generate something in a solution or in the studio first.</p>
        </EmptyState>
      ) : (
        <>
          <RepurposePicker groups={groups} targets={targets} />
          <p className="mt-4 text-sm text-(--muted)">Outputs join the content graph and inherit staleness.</p>
        </>
      )}
    </div>
  );
}
