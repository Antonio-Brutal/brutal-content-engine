"use server";

import { getActivePack, getSolutionDocAsset, listAllAssets, listSolutions } from "@/db/repo";
import { getProvider, DEFAULT_MODEL } from "@/lib/llm";

// Topic planner (slice D). Ephemeral by design: the action returns markdown for the
// client to render and copy, nothing is persisted and nothing is revalidated.

export type TopicSuggestions = { ok: boolean; markdown?: string; error?: string };

function h1Of(bodyMd: string): string | null {
  const m = bodyMd.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

/** Propose the next 5 blog topics, grounded only in published solutions. Slow (up to ~30s LLM call). */
export async function suggestTopicsAction(): Promise<TopicSuggestions> {
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return { ok: false, error: configError };

  const published = listSolutions().filter((s) => s.status === "published");
  if (published.length === 0) {
    return { ok: false, error: "No published solutions yet. The planner grounds every topic in shipped work, publish a solution first." };
  }

  const solutionBriefs = published
    .map((s) => {
      const doc = getSolutionDocAsset(s.id);
      const excerpt = doc?.bodyMd.trim() ? doc.bodyMd.trim().slice(0, 500) : "(no solution doc yet)";
      return `## ${s.title}\n${excerpt}`;
    })
    .join("\n\n");

  const blogTitles = listAllAssets()
    .filter((a) => a.type === "blog" && a.bodyMd.trim() !== "")
    .map((a) => h1Of(a.bodyMd))
    .filter((t): t is string => Boolean(t));

  try {
    const result = await provider.stream({
      system: `You are the content strategist for Brutal's content engine. From the published solutions below, propose the next 5 blog topics.

Rules:
- Ground every topic ONLY in the published solutions or in obvious adjacent angles of that same work. Never invent capabilities, clients, numbers, or projects that are not in the material.
- Do not repeat or lightly rephrase a blog title that already exists.
- Working titles follow the style pack's title rules. No colon formulas.
- For each topic give exactly four lines: the working title, a one-sentence angle, which solution it draws from, and what recorded evidence it would need before drafting.

Respond as a plain markdown list, one numbered item per topic, those four lines per item. No preamble, no closing remarks.

THE BRAND PACK:
${getActivePack()}`,
      messages: [
        {
          role: "user",
          content: `PUBLISHED SOLUTIONS (first 500 characters of each solution doc):\n\n${solutionBriefs}\n\n---\n\nEXISTING BLOG TITLES (do not repeat these):\n${blogTitles.length ? blogTitles.map((t) => `- ${t}`).join("\n") : "(none yet)"}`,
        },
      ],
      model: DEFAULT_MODEL,
      maxTokens: 3000,
    });
    const markdown = result.text.trim();
    if (!markdown) return { ok: false, error: "The planner returned nothing, try again." };
    return { ok: true, markdown };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
