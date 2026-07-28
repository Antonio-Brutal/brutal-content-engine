import { getActivePack, getAsset, saveWorkingBody, writeVersion } from "@/db/repo";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getProvider, DEFAULT_MODEL } from "@/lib/llm";

// The automatic compliance pass: after a draft lands, a judge run executes the
// style pack's mechanical final gate plus a citability read, and pins the result
// to the asset (metaJson.review) so the board shows pre-vetted drafts.

export type Review = {
  score: number; // 0-100 overall
  citability: number; // 0-100, AI-search extractability
  hallmark: number; // 0-100, distance to the hallmark register
  violations: string[];
  at: number;
};

export async function runCompliancePass(assetId: string): Promise<Review | null> {
  const asset = getAsset(assetId);
  if (!asset || !asset.bodyMd.trim()) return null;
  const provider = getProvider();
  if (provider.configError()) return null;

  try {
    const result = await provider.stream({
      system: `You are the final-gate reviewer for Brutal's content engine. Below is the Brand Pack (the rulebook) and one generated asset. Execute the style pack's mechanical checks against the asset: closed-world markers used instead of invented facts, banned words and structural tells, em dashes (must be zero), comparative claims without numbers, confound statements on before/after claims, format rules for the asset's type. Also judge citability (answer-first passages, self-contained blocks, stats with sources) and closeness to the hallmark register (specificity, honesty, mechanism-before-benefit).

Respond with ONLY a JSON object, no fences: {"score": 0-100, "citability": 0-100, "hallmark": 0-100, "violations": ["specific violation with the offending phrase", ...]}. Violations list concrete, quotable failures only; an empty list is a legitimate result. Judge the publishable body; ignore the producer note and platform notes except for checking they exist where required.

THE BRAND PACK:
${getActivePack()}`,
      messages: [{ role: "user", content: `ASSET TYPE: ${asset.type}\n\nASSET BODY:\n${asset.bodyMd}` }],
      model: DEFAULT_MODEL,
      maxTokens: 4000,
    });
    const jsonText = result.text.slice(result.text.indexOf("{"), result.text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText) as Partial<Review>;
    const review: Review = {
      score: clamp(parsed.score),
      citability: clamp(parsed.citability),
      hallmark: clamp(parsed.hallmark),
      violations: Array.isArray(parsed.violations) ? parsed.violations.slice(0, 12).map(String) : [],
      at: Date.now(),
    };
    const fresh = getAsset(assetId);
    let meta: Record<string, unknown> = {};
    try {
      meta = fresh?.metaJson ? JSON.parse(fresh.metaJson) : {};
    } catch {
      meta = {};
    }
    db.update(schema.assets).set({ metaJson: JSON.stringify({ ...meta, review }) }).where(eq(schema.assets.id, assetId)).run();
    return review;
  } catch {
    return null; // the pass is best-effort; a failed review never blocks the draft
  }
}

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Parses metaJson.review off an asset row. */
export function getReview(metaJson: string | null): Review | null {
  if (!metaJson) return null;
  try {
    const r = JSON.parse(metaJson)?.review;
    return r && typeof r.score === "number" ? (r as Review) : null;
  } catch {
    return null;
  }
}

/** German variant generation: stored on the asset (metaJson.de), never a separate node. */
export async function generateGermanVariant(assetId: string): Promise<{ ok: boolean; error?: string }> {
  const asset = getAsset(assetId);
  if (!asset || !asset.bodyMd.trim()) return { ok: false, error: "Nothing to localize yet." };
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return { ok: false, error: configError };

  try {
    const result = await provider.stream({
      system: `You localize Brutal's content into German (Germany, formal Sie only where a reader is addressed; Brutal's register stays first-person plural "wir"). This is a faithful localization, not a rewrite: keep every fact, number, source class, [MISSING] marker, directive line ([[...]] and ::: blocks), markdown structure, and URL exactly; translate prose, headings, labels, and quotes' framing (recorded quotes stay in their original language with a German lead-in). The register rules apply unchanged: no em dashes, no hype adjectives, no exclamation marks. Technical terms established in German tech usage (Pipeline, Dashboard, Pull Request) stay as is.

Respond with ONLY the localized markdown, no preamble.`,
      messages: [{ role: "user", content: asset.bodyMd }],
      model: DEFAULT_MODEL,
      maxTokens: 32000,
    });
    const fresh = getAsset(assetId);
    let meta: Record<string, unknown> = {};
    try {
      meta = fresh?.metaJson ? JSON.parse(fresh.metaJson) : {};
    } catch {
      meta = {};
    }
    db.update(schema.assets)
      .set({ metaJson: JSON.stringify({ ...meta, de: { bodyMd: result.text, at: Date.now(), sourceUpdatedAt: asset.updatedAt } }) })
      .where(eq(schema.assets.id, assetId))
      .run();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Parses metaJson.de off an asset row. */
export function getGermanVariant(metaJson: string | null): { bodyMd: string; at: number; sourceUpdatedAt: number } | null {
  if (!metaJson) return null;
  try {
    const de = JSON.parse(metaJson)?.de;
    return de && typeof de.bodyMd === "string" ? de : null;
  } catch {
    return null;
  }
}

/** The copy-editing second pass: a focused edit of the current body, written as a new AI version. */
export async function runEditPass(assetId: string): Promise<{ ok: boolean; summary?: string; error?: string }> {
  const asset = getAsset(assetId);
  if (!asset || !asset.bodyMd.trim()) return { ok: false, error: "Nothing to edit yet." };
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return { ok: false, error: configError };

  try {
    const result = await provider.stream({
      system: `You are Brutal's copy editor. Tighten the asset below without changing its meaning, facts, structure, directives, or format: cut redundant sentences, split overlong ones, replace weak verbs, remove any residual banned words or hedges, fix rhythm. Never add facts, never remove [MISSING] markers, never touch numbers or directive lines. The Brand Pack rules apply in full.

Respond with ONLY: the edited markdown, then a line "===EDITS===", then 2-5 plain bullet lines summarizing what changed.

THE BRAND PACK:
${getActivePack()}`,
      messages: [{ role: "user", content: asset.bodyMd }],
      model: DEFAULT_MODEL,
      maxTokens: 32000,
    });
    const [edited, summary] = result.text.split("===EDITS===");
    if (!edited?.trim()) return { ok: false, error: "The edit pass returned nothing." };
    writeVersion(assetId, edited.trim(), "ai");
    saveWorkingBody(assetId, edited.trim());
    return { ok: true, summary: summary?.trim() || "Edited." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
