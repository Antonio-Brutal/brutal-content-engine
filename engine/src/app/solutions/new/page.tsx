import { getProvider } from "@/lib/llm";
import { getSolution, listMediaForSolution } from "@/db/repo";
import { PageTitle } from "@/components/ui";
import { Builder, type BuilderInitial, type Turn } from "@/components/builder/Builder";

export const dynamic = "force-dynamic";

// Rebuilds the builder's initial state from a persisted solution so an
// interrupted session can be resumed instead of stranding the row doc-less.
function loadInitial(solutionId: string): BuilderInitial | undefined {
  const solution = getSolution(solutionId);
  if (!solution) return undefined;
  let interviewLog: Turn[] = [];
  if (solution.interviewLog) {
    try {
      const parsed = JSON.parse(solution.interviewLog);
      if (Array.isArray(parsed)) interviewLog = parsed as Turn[];
    } catch {
      interviewLog = [];
    }
  }
  return {
    solutionId: solution.id,
    title: solution.title,
    dumpRaw: solution.dumpRaw ?? "",
    links: solution.links ?? "",
    interviewLog,
    media: listMediaForSolution(solutionId).map((m) => ({ id: m.id, kind: m.kind, mime: m.mime })),
  };
}

export default async function NewSolutionPage({
  searchParams,
}: {
  searchParams: Promise<{ solutionId?: string | string[] }>;
}) {
  const sp = await searchParams;
  const solutionId = typeof sp.solutionId === "string" ? sp.solutionId : undefined;
  const initial = solutionId ? loadInitial(solutionId) : undefined;
  const configError = getProvider().configError();
  return (
    <div>
      <PageTitle sub="Dump everything you know on the left. The interviewer pulls the rest out of you, one question at a time. Draft the doc when it says it has enough.">
        {initial ? "Resume solution" : "New solution"}
      </PageTitle>
      <Builder key={initial?.solutionId ?? "new"} initialConfigError={configError} initial={initial} />
    </div>
  );
}
