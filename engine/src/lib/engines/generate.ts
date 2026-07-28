import {
  Asset,
  getActivePack,
  createJob,
  ensureSolutionDocAsset,
  estimateCostUsd,
  finishJob,
  getAsset,
  getClient,
  getPromptOverride,
  getSolution,
  getSolutionDocAsset,
  insertEditDiff,
  latestVersionNumber,
  listAssetsForSolution,
  listCaseStudyTemplates,
  listMediaForSolution,
  listVersions,
  publishSolution,
  setAssetStatus,
  writeVersion,
} from "@/db/repo";
import { db, schema } from "@/db/client";
import { getProvider, DEFAULT_MODEL, LONGFORM_MODEL } from "@/lib/llm";
import { caseStudySystem, ENGINE_SYSTEMS, EngineType } from "./prompts";
import { nanoid } from "nanoid";

// The generation pipeline. Spec §05: every Claude call is a persisted job; a new
// asset_version is written on regenerate and approval; the cascade fires only on
// approved versions; the graph is a DAG by construction (new assets only).

const now = () => Date.now();

function mediaManifest(solutionId: string) {
  const rows = listMediaForSolution(solutionId);
  if (!rows.length) return "(no uploads)";
  return rows.map((m) => `media://${m.id}, ${m.kind}, ${m.mime}${m.alt ? `, "${m.alt}"` : ""}`).join("\n");
}

function ensureAssetOfType(solutionId: string, type: EngineType): Asset {
  const existing = listAssetsForSolution(solutionId).find((a) => a.type === type);
  if (existing) return existing;
  const a = {
    id: nanoid(12),
    solutionId,
    type,
    status: "draft" as const,
    bodyMd: "",
    metaJson: null,
    sourceAssetId: null as string | null,
    sourceVersion: null as number | null,
    createdAt: now(),
    updatedAt: now(),
  };
  db.insert(schema.assets).values(a).run();
  return a;
}

/** Build the closed-world brief each engine reads. */
function buildBrief(type: EngineType, solutionId: string): { brief: string; error?: string } {
  const solution = getSolution(solutionId);
  if (!solution) return { brief: "", error: "Solution not found." };
  const doc = getSolutionDocAsset(solutionId);
  if (!doc || !doc.bodyMd.trim()) return { brief: "", error: "The solution doc is empty, draft and approve it first." };

  const parts = [
    `SOLUTION DOC (source of truth):\n${doc.bodyMd}`,
    solution.dumpRaw ? `RAW INFO DUMP (context, same closed world):\n${solution.dumpRaw}` : "",
    solution.links ? `LINKS:\n${solution.links}` : "",
    `MEDIA LIBRARY (reference by media://<id>):\n${mediaManifest(solutionId)}`,
  ];

  if (type !== "blog") {
    const blog = listAssetsForSolution(solutionId).find((a) => a.type === "blog");
    if (!blog || blog.status !== "approved") {
      return { brief: "", error: "The blog post must be approved first, it is the gate for downstream engines." };
    }
    parts.unshift(`APPROVED BLOG POST (primary source):\n${blog.bodyMd}`);
  }

  if (type === "case_study") {
    if (!solution.clientId) return { brief: "", error: "No client attached. Attach a client record to unblock the case study." };
    const client = getClient(solution.clientId);
    if (!client) return { brief: "", error: "Attached client not found." };
    parts.push(
      `CLIENT FACTS (THE ONLY SOURCE for client name, numbers, quotes, timeline):\nName: ${client.name}\nPermission to name publicly: ${client.permission}\nRecorded facts: ${client.factsJson || "(none recorded, everything client-specific is [MISSING])"}`
    );
  }

  return { brief: parts.filter(Boolean).join("\n\n---\n\n") };
}

export type RunResult = { ok: boolean; assetId: string; error?: string };

/**
 * Facts-driven template pick for the automatic fan-out, mirroring each template's
 * "when to use" condition: recorded quotes favor quote-led; two or more recorded
 * metrics favor stat-led-hero; real photos favor photo-story; a thin brief gets
 * the one-pager. An explicit or previously stored choice always wins over this.
 */
function pickCaseStudyTemplate(solutionId: string): string | null {
  const available = new Set(listCaseStudyTemplates().map((t) => t.slug));
  if (!available.size) return null;
  const pick = (slug: string) => (available.has(slug) ? slug : null);

  const solution = getSolution(solutionId);
  const client = solution?.clientId ? getClient(solution.clientId) : undefined;
  let facts: { quotes?: unknown[]; metrics?: unknown[] } = {};
  try {
    facts = client?.factsJson ? JSON.parse(client.factsJson) : {};
  } catch {
    facts = {};
  }
  const quotes = Array.isArray(facts.quotes) ? facts.quotes.length : 0;
  const metrics = Array.isArray(facts.metrics) ? facts.metrics.length : 0;
  const photos = listMediaForSolution(solutionId).filter((m) => m.kind === "photo" || m.kind === "screenshot").length;

  if (quotes > 0) return pick("quote-led") ?? pick("stat-led-hero");
  if (metrics >= 2) return pick("stat-led-hero") ?? pick("one-pager");
  if (photos > 0) return pick("photo-story") ?? pick("one-pager");
  return pick("one-pager");
}

/** Working-copy edits live only on the asset row; true when bodyMd was never captured as a version. */
function hasUnversionedEdits(asset: Asset): boolean {
  if (asset.bodyMd.trim() === "") return false;
  const latest = listVersions(asset.id)[0];
  return !latest || latest.bodyMd !== asset.bodyMd;
}

/** Run one engine for a solution: generating → draft (AI version) or failed. Retry = call again. */
export async function runEngine(type: EngineType, solutionId: string, opts?: { template?: string }): Promise<RunResult> {
  const asset = ensureAssetOfType(solutionId, type);
  const { brief, error } = buildBrief(type, solutionId);
  if (error) {
    setAssetStatus(asset.id, type === "case_study" ? "blocked" : "failed");
    return { ok: false, assetId: asset.id, error };
  }

  const provider = getProvider();
  const configError = provider.configError();
  if (configError) {
    setAssetStatus(asset.id, "failed");
    return { ok: false, assetId: asset.id, error: configError };
  }

  // pin the DAG edge to the upstream approved version
  const upstream = type === "blog" ? getSolutionDocAsset(solutionId) : listAssetsForSolution(solutionId).find((a) => a.type === "blog");
  if (upstream) {
    db.update(schema.assets)
      .set({ sourceAssetId: upstream.id, sourceVersion: latestVersionNumber(upstream.id), updatedAt: now() })
      .where(eqId(asset.id))
      .run();
  }

  // snapshot unversioned human edits so the incoming AI version never destroys them
  if (hasUnversionedEdits(asset)) {
    writeVersion(asset.id, asset.bodyMd, "human");
  }

  setAssetStatus(asset.id, "generating");
  const model = type === "blog" || type === "case_study" ? LONGFORM_MODEL : DEFAULT_MODEL;
  const jobId = createJob({ assetId: asset.id, engine: type, model });
  try {
    const override = getPromptOverride(type);
    // template resolution: explicit choice > previously chosen for this asset > facts-driven pick
    let template = opts?.template;
    if (type === "case_study" && !template && asset.metaJson) {
      try {
        const stored = JSON.parse(asset.metaJson)?.template;
        if (typeof stored === "string" && stored) template = stored;
      } catch {
        // unreadable metaJson, fall through to the chooser
      }
    }
    if (type === "case_study" && !template) {
      template = pickCaseStudyTemplate(solutionId) ?? undefined;
    }
    const base = type === "case_study" ? caseStudySystem(template) : ENGINE_SYSTEMS[type]();
    const system = base + (override ? `\n\nOPERATOR OVERRIDES (these win over anything above):\n${override}` : "");
    if (type === "case_study" && template) {
      let meta: Record<string, unknown> = {};
      try {
        meta = asset.metaJson ? JSON.parse(asset.metaJson) : {};
      } catch {
        meta = {};
      }
      db.update(schema.assets).set({ metaJson: JSON.stringify({ ...meta, template }) }).where(eqId(asset.id)).run();
    }
    const result = await getProvider().stream({
      system,
      messages: [{ role: "user", content: `THE BRIEF:\n\n${brief}` }],
      model,
      maxTokens: type === "blog" || type === "case_study" ? 32000 : 16000,
      temperature: 0.6,
    });
    // someone may have approved or otherwise moved the asset while we streamed; never clobber that
    const fresh = getAsset(asset.id);
    if (!fresh || fresh.status !== "generating") {
      const superseded = "superseded (status changed during generation)";
      finishJob(jobId, { status: "failed", error: superseded });
      return { ok: false, assetId: asset.id, error: superseded };
    }
    writeVersion(asset.id, result.text, "ai");
    setAssetStatus(asset.id, "draft");
    finishJob(jobId, { status: "succeeded", tokensIn: result.tokensIn, tokensOut: result.tokensOut, costUsd: estimateCostUsd(result.tokensIn, result.tokensOut) });
    await runPostDraftHooks(asset.id, type);
    return { ok: true, assetId: asset.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setAssetStatus(asset.id, "failed");
    finishJob(jobId, { status: "failed", error: message });
    return { ok: false, assetId: asset.id, error: message };
  }
}

/** Best-effort follow-ups after every fresh draft: the compliance judge, and Flux
 *  auto-fill of illustrative case-study image slots (screenshots stay human-only). */
async function runPostDraftHooks(assetId: string, type: EngineType) {
  try {
    if (type === "case_study") await autoFillIllustrativeSlots(assetId);
  } catch {
    /* slot filling never blocks the draft */
  }
  try {
    const { runCompliancePass } = await import("@/lib/compliance");
    await runCompliancePass(assetId);
  } catch {
    /* the review is advisory */
  }
}

async function autoFillIllustrativeSlots(assetId: string) {
  const asset = getAsset(assetId);
  if (!asset) return;
  const { getImageProvider, brandArtDirection } = await import("@/lib/images");
  const provider = getImageProvider();
  if (provider.configError()) return;
  const { parseCaseStudy, fillSlotInMarkdown } = await import("@/components/case-study/parse");
  const { createMedia } = await import("@/db/repo");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { MEDIA_DIR } = await import("@/db/client");

  const empty = parseCaseStudy(asset.bodyMd)
    .filter((b) => b.type === "image" && !b.mediaId && b.kind !== "screenshot" && b.brief)
    .slice(0, 2) as { slot: string; brief: string }[];

  let body = asset.bodyMd;
  for (const slot of empty) {
    const { data, mime } = await provider.generate({ prompt: brandArtDirection(slot.brief) });
    const storageKey = `${nanoid(12)}.png`;
    fs.writeFileSync(path.join(MEDIA_DIR, storageKey), data);
    const media = createMedia({ solutionId: asset.solutionId ?? undefined, kind: "infographic", storageKey, mime, alt: slot.brief.slice(0, 200) });
    body = fillSlotInMarkdown(body, slot.slot, media.id);
  }
  if (empty.length) {
    db.update(schema.assets).set({ bodyMd: body, updatedAt: now() }).where(eqId(assetId)).run();
  }
}

/** Two independent blog drafts judged against each other; the winner becomes the working draft. */
export async function runBlogVariants(solutionId: string): Promise<RunResult & { judgeSummary?: string }> {
  const asset = ensureAssetOfType(solutionId, "blog");
  const { brief, error } = buildBrief("blog", solutionId);
  if (error) return { ok: false, assetId: asset.id, error };
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return { ok: false, assetId: asset.id, error: configError };

  if (hasUnversionedEdits(asset)) writeVersion(asset.id, asset.bodyMd, "human");
  setAssetStatus(asset.id, "generating");
  const jobId = createJob({ assetId: asset.id, engine: "blog-variants", model: LONGFORM_MODEL });
  try {
    const system = ENGINE_SYSTEMS.blog();
    const angles = [
      "\n\nVARIANT DIRECTION: open with the cold-open-on-universal-pain move.",
      "\n\nVARIANT DIRECTION: open with the claim-first move and lead the strongest recorded number.",
    ];
    const drafts = await Promise.all(
      angles.map((a) =>
        provider.stream({ system: system + a, messages: [{ role: "user", content: `THE BRIEF:\n\n${brief}` }], model: LONGFORM_MODEL, maxTokens: 32000 })
      )
    );
    const judge = await provider.stream({
      system: `You judge two blog drafts against Brutal's Brand Pack (hallmark register, closed world, citability). Respond with ONLY a JSON object, no fences: {"winner": 1 or 2, "why": "two sentences naming concrete craft differences"}.\n\nTHE BRAND PACK:\n${getActivePack()}`,
      messages: [{ role: "user", content: `DRAFT 1:\n${drafts[0].text}\n\n=====\n\nDRAFT 2:\n${drafts[1].text}` }],
      model: DEFAULT_MODEL,
      maxTokens: 2000,
    });
    let winner = 1;
    let why = "";
    try {
      const j = JSON.parse(judge.text.slice(judge.text.indexOf("{"), judge.text.lastIndexOf("}") + 1));
      winner = j.winner === 2 ? 2 : 1;
      why = String(j.why ?? "");
    } catch {
      /* default to draft 1 */
    }
    const loser = drafts[winner === 1 ? 1 : 0];
    const win = drafts[winner - 1];

    const fresh = getAsset(asset.id);
    if (!fresh || fresh.status !== "generating") {
      finishJob(jobId, { status: "failed", error: "superseded (status changed during generation)" });
      return { ok: false, assetId: asset.id, error: "superseded (status changed during generation)" };
    }
    writeVersion(asset.id, loser.text, "ai"); // runner-up preserved as a version
    writeVersion(asset.id, win.text, "ai"); // winner is the working draft
    setAssetStatus(asset.id, "draft");
    let meta: Record<string, unknown> = {};
    try {
      meta = fresh.metaJson ? JSON.parse(fresh.metaJson) : {};
    } catch {
      meta = {};
    }
    db.update(schema.assets).set({ metaJson: JSON.stringify({ ...meta, variantJudge: { winner, why, at: now() } }) }).where(eqId(asset.id)).run();
    const tokensIn = drafts[0].tokensIn + drafts[1].tokensIn + judge.tokensIn;
    const tokensOut = drafts[0].tokensOut + drafts[1].tokensOut + judge.tokensOut;
    finishJob(jobId, { status: "succeeded", tokensIn, tokensOut, costUsd: estimateCostUsd(tokensIn, tokensOut) });
    await runPostDraftHooks(asset.id, "blog");
    return { ok: true, assetId: asset.id, judgeSummary: why };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setAssetStatus(asset.id, "failed");
    finishJob(jobId, { status: "failed", error: message });
    return { ok: false, assetId: asset.id, error: message };
  }
}

/** Blog approval fans out the rest (spec §02 two-stage fan-out). Case study only runs when a client is attached. */
export async function fanOutFromBlog(solutionId: string): Promise<RunResult[]> {
  const solution = getSolution(solutionId);
  const existing = listAssetsForSolution(solutionId);

  // never regenerate over approved or hand-edited work (mark stale instead), and never
  // double-run an asset that is already generating (re-entry guard for concurrent approvals)
  const runGuarded = async (type: EngineType): Promise<RunResult> => {
    const asset = existing.find((a) => a.type === type);
    if (asset) {
      if (asset.status === "generating") {
        return { ok: false, assetId: asset.id, error: "Skipped: a generation is already in flight." };
      }
      if (asset.status === "approved" || hasUnversionedEdits(asset)) {
        setAssetStatus(asset.id, "stale");
        return { ok: false, assetId: asset.id, error: "Skipped: existing approved or edited content kept, marked stale." };
      }
    }
    return runEngine(type, solutionId);
  };

  const downstream: EngineType[] = ["page", "tweet", "linkedin"];
  const results = await Promise.all(downstream.map((t) => runGuarded(t)));
  if (solution?.clientId) {
    results.push(await runGuarded("case_study"));
  } else {
    const cs = ensureAssetOfType(solutionId, "case_study");
    setAssetStatus(cs.id, "blocked");
    results.push({ ok: false, assetId: cs.id, error: "Blocked: no client record attached." });
  }
  return results;
}

/** Approve an asset: capture the edit diff, write the human version, cascade staleness, fan out if it's the blog. */
export async function approveAsset(assetId: string, opts?: { fanOut?: boolean }): Promise<{ version: number; fanned: RunResult[] }> {
  const asset = getAsset(assetId);
  if (!asset) throw new Error("Asset not found.");

  // voice-loop training data: only diff when the newest version overall is the AI draft,
  // so re-approvals of an already-edited asset do not re-insert the same diff
  const versions = listVersions(assetId);
  const last = versions[0];
  if (last && last.author === "ai" && last.bodyMd !== asset.bodyMd) {
    insertEditDiff(assetId, last.bodyMd, asset.bodyMd);
  }

  const version = writeVersion(assetId, asset.bodyMd, "human");
  setAssetStatus(assetId, "approved");
  markStaleDescendants(assetId, version);

  let fanned: RunResult[] = [];
  if (asset.type === "blog" && asset.solutionId && opts?.fanOut !== false) {
    fanned = await fanOutFromBlog(asset.solutionId);
  }
  return { version, fanned };
}

/** Approve + publish the solution doc, then auto-draft the blog (stage one of the fan-out). */
export async function publishSolutionAndDraftBlog(solutionId: string): Promise<RunResult> {
  const { docAssetId, version } = publishSolution(solutionId);
  markStaleDescendants(docAssetId, version);
  return runEngine("blog", solutionId);
}

/** Staleness cascade: anything generated from an older version of this asset flips stale. */
export function markStaleDescendants(assetId: string, newVersion: number) {
  const all = db.select().from(schema.assets).all();
  const direct = all.filter((a) => a.sourceAssetId === assetId && (a.sourceVersion ?? 0) < newVersion && a.bodyMd.trim() !== "");
  for (const child of direct) {
    if (child.status === "draft" || child.status === "approved" || child.status === "stale") {
      setAssetStatus(child.id, "stale");
      // transitive: a stale parent makes its own children stale against its latest version
      markStaleDescendants(child.id, Number.MAX_SAFE_INTEGER);
    }
  }
}

/** Repurpose any asset into any format. Creates a NEW asset each time, so the graph stays a DAG by construction. */
export async function runRepurpose(sourceAssetId: string, targetType: EngineType): Promise<RunResult> {
  const source = getAsset(sourceAssetId);
  if (!source || !source.bodyMd.trim()) return { ok: false, assetId: "", error: "Source asset is empty." };

  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return { ok: false, assetId: "", error: configError };

  const a = {
    id: nanoid(12),
    solutionId: source.solutionId,
    type: targetType,
    status: "generating" as const,
    bodyMd: "",
    metaJson: JSON.stringify({ repurposedFrom: source.type }),
    sourceAssetId: source.id,
    sourceVersion: latestVersionNumber(source.id),
    createdAt: now(),
    updatedAt: now(),
  };
  db.insert(schema.assets).values(a).run();

  const model = targetType === "blog" || targetType === "case_study" ? LONGFORM_MODEL : DEFAULT_MODEL;
  const jobId = createJob({ assetId: a.id, engine: `repurpose:${source.type}->${targetType}`, model });
  try {
    const override = getPromptOverride(targetType);
    const system =
      ENGINE_SYSTEMS[targetType]() +
      `\n\nTRANSMUTE MODE: the brief below is an existing ${source.type} asset. Recast its substance into the target format. Same closed world, the source asset IS the brief.` +
      (override ? `\n\nOPERATOR OVERRIDES:\n${override}` : "");
    const result = await provider.stream({
      system,
      messages: [{ role: "user", content: `SOURCE ASSET (${source.type}):\n\n${source.bodyMd}` }],
      model,
      maxTokens: 24000,
      temperature: 0.6,
    });
    const fresh = getAsset(a.id);
    if (!fresh || fresh.status !== "generating") {
      const superseded = "superseded (status changed during generation)";
      finishJob(jobId, { status: "failed", error: superseded });
      return { ok: false, assetId: a.id, error: superseded };
    }
    writeVersion(a.id, result.text, "ai");
    setAssetStatus(a.id, "draft");
    finishJob(jobId, { status: "succeeded", tokensIn: result.tokensIn, tokensOut: result.tokensOut, costUsd: estimateCostUsd(result.tokensIn, result.tokensOut) });
    await runPostDraftHooks(a.id, targetType);
    return { ok: true, assetId: a.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setAssetStatus(a.id, "failed");
    finishJob(jobId, { status: "failed", error: message });
    return { ok: false, assetId: a.id, error: message };
  }
}

/** Studio: generate a standalone asset from an ad-hoc brief (no solution). */
export async function runAdhoc(type: EngineType, brief: string): Promise<RunResult> {
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return { ok: false, assetId: "", error: configError };

  const a = {
    id: nanoid(12),
    solutionId: null as string | null,
    type,
    status: "generating" as const,
    bodyMd: "",
    metaJson: JSON.stringify({ adhoc: true }),
    sourceAssetId: null as string | null,
    sourceVersion: null as number | null,
    createdAt: now(),
    updatedAt: now(),
  };
  db.insert(schema.assets).values(a).run();

  const model = type === "blog" || type === "case_study" ? LONGFORM_MODEL : DEFAULT_MODEL;
  const jobId = createJob({ assetId: a.id, engine: `studio:${type}`, model });
  try {
    const override = getPromptOverride(type);
    const system = ENGINE_SYSTEMS[type]() + (override ? `\n\nOPERATOR OVERRIDES:\n${override}` : "");
    const result = await provider.stream({
      system,
      messages: [{ role: "user", content: `THE BRIEF:\n\n${brief}` }],
      model,
      maxTokens: 32000,
      temperature: 0.6,
    });
    const fresh = getAsset(a.id);
    if (!fresh || fresh.status !== "generating") {
      const superseded = "superseded (status changed during generation)";
      finishJob(jobId, { status: "failed", error: superseded });
      return { ok: false, assetId: a.id, error: superseded };
    }
    writeVersion(a.id, result.text, "ai");
    setAssetStatus(a.id, "draft");
    finishJob(jobId, { status: "succeeded", tokensIn: result.tokensIn, tokensOut: result.tokensOut, costUsd: estimateCostUsd(result.tokensIn, result.tokensOut) });
    await runPostDraftHooks(a.id, type);
    return { ok: true, assetId: a.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setAssetStatus(a.id, "failed");
    finishJob(jobId, { status: "failed", error: message });
    return { ok: false, assetId: a.id, error: message };
  }
}

import { eq } from "drizzle-orm";
function eqId(assetId: string) {
  return eq(schema.assets.id, assetId);
}
