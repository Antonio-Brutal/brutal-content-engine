import { createJob, createVaultEntry, estimateCostUsd, finishJob, listUnprocessedDiffs, markDiffProcessed, updateVaultEntry } from "@/db/repo";
import { getProvider, DEFAULT_MODEL } from "@/lib/llm";

// Phase 4 voice loop: distill accumulated draft-vs-final edit diffs into proposed
// standing rules. Proposed = vault rule with active=false; a human activates it
// from /brand. Nothing silently changes generation behavior.

export async function distillDiffs(): Promise<{ processed: number; proposed: number; error?: string }> {
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return { processed: 0, proposed: 0, error: configError };

  const diffs = listUnprocessedDiffs();
  if (!diffs.length) return { processed: 0, proposed: 0 };

  const jobId = createJob({ engine: "voice-distill", model: DEFAULT_MODEL });
  try {
    const samples = diffs
      .slice(0, 20)
      .map((d, i) => `--- EDIT ${i + 1} ---\nAI DRAFT:\n${d.draftMd.slice(0, 3000)}\n\nHUMAN FINAL:\n${d.finalMd.slice(0, 3000)}`)
      .join("\n\n");
    const result = await provider.stream({
      system: `You distill a writer's edits into standing style rules. Below are AI drafts and the human's approved finals. Find RECURRING, GENERALIZABLE corrections: phrasing the human consistently removes, structures they impose, length changes, tone shifts. Ignore one-off factual fixes. Output 0-5 rules, one per line, each a single imperative sentence an LLM can follow mechanically (e.g. "Cut any sentence that restates the previous one in different words."). If no recurring pattern exists, output exactly: NONE`,
      messages: [{ role: "user", content: samples }],
      maxTokens: 8000,
      temperature: 0.3,
    });
    finishJob(jobId, { status: "succeeded", tokensIn: result.tokensIn, tokensOut: result.tokensOut, costUsd: estimateCostUsd(result.tokensIn, result.tokensOut) });

    const lines = result.text
      .split("\n")
      .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
      .filter((l) => l && l !== "NONE");

    let firstRuleId: string | null = null;
    for (const line of lines) {
      const entry = createVaultEntry({ kind: "rule", title: `Proposed: ${line.slice(0, 60)}`, contentMd: line });
      // proposed rules start inactive, a human activates them in /brand
      updateVaultEntry(entry.id, { active: false });
      if (!firstRuleId) firstRuleId = entry.id;
    }
    for (const d of diffs.slice(0, 20)) markDiffProcessed(d.id, firstRuleId);
    return { processed: Math.min(diffs.length, 20), proposed: lines.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    finishJob(jobId, { status: "failed", error: message });
    return { processed: 0, proposed: 0, error: message };
  }
}
