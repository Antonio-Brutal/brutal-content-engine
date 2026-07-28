import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "./client";

const now = () => Date.now();
export const id = () => nanoid(12);

// ---------- Solutions ----------

export type Solution = typeof schema.solutions.$inferSelect;
export type Asset = typeof schema.assets.$inferSelect;
export type VaultEntry = typeof schema.brandVault.$inferSelect;
export type Media = typeof schema.media.$inferSelect;

export function listSolutions() {
  return db.select().from(schema.solutions).orderBy(desc(schema.solutions.updatedAt)).all();
}

export function getSolution(solutionId: string) {
  return db.select().from(schema.solutions).where(eq(schema.solutions.id, solutionId)).get();
}

export function createSolution(input: { title: string; dumpRaw?: string; links?: string }) {
  const s = { id: id(), title: input.title, status: "draft" as const, dumpRaw: input.dumpRaw ?? null, links: input.links ?? null, interviewLog: null, createdBy: "antonio", createdAt: now(), updatedAt: now() };
  db.insert(schema.solutions).values(s).run();
  return s;
}

export function updateSolution(solutionId: string, patch: Partial<Pick<Solution, "title" | "dumpRaw" | "links" | "interviewLog" | "status">>) {
  db.update(schema.solutions).set({ ...patch, updatedAt: now() }).where(eq(schema.solutions.id, solutionId)).run();
}

// ---------- Assets + versions ----------
// Version semantics (spec §05): a new asset_version is written on regenerate (AI) and on
// approval (human); intermediate saves only update working state on the asset row.

export function getAsset(assetId: string) {
  return db.select().from(schema.assets).where(eq(schema.assets.id, assetId)).get();
}

export function listAssetsForSolution(solutionId: string) {
  return db.select().from(schema.assets).where(eq(schema.assets.solutionId, solutionId)).all();
}

export function getSolutionDocAsset(solutionId: string) {
  return db
    .select()
    .from(schema.assets)
    .where(and(eq(schema.assets.solutionId, solutionId), eq(schema.assets.type, "solution")))
    .get();
}

export function ensureSolutionDocAsset(solutionId: string) {
  const existing = getSolutionDocAsset(solutionId);
  if (existing) return existing;
  const a = { id: id(), solutionId, type: "solution" as const, status: "draft" as const, bodyMd: "", metaJson: null, sourceAssetId: null, sourceVersion: null, createdAt: now(), updatedAt: now() };
  db.insert(schema.assets).values(a).run();
  return a;
}

export function saveWorkingBody(assetId: string, bodyMd: string) {
  db.update(schema.assets).set({ bodyMd, updatedAt: now() }).where(eq(schema.assets.id, assetId)).run();
}

export function latestVersionNumber(assetId: string) {
  const v = db.select().from(schema.assetVersions).where(eq(schema.assetVersions.assetId, assetId)).orderBy(desc(schema.assetVersions.version)).limit(1).get();
  return v?.version ?? 0;
}

export function writeVersion(assetId: string, bodyMd: string, author: "ai" | "human") {
  const version = latestVersionNumber(assetId) + 1;
  db.insert(schema.assetVersions).values({ id: id(), assetId, version, bodyMd, author, createdAt: now() }).run();
  db.update(schema.assets).set({ bodyMd, updatedAt: now() }).where(eq(schema.assets.id, assetId)).run();
  return version;
}

export function listVersions(assetId: string) {
  return db.select().from(schema.assetVersions).where(eq(schema.assetVersions.assetId, assetId)).orderBy(desc(schema.assetVersions.version)).all();
}

export function setAssetStatus(assetId: string, status: Asset["status"]) {
  db.update(schema.assets).set({ status, updatedAt: now() }).where(eq(schema.assets.id, assetId)).run();
}

/** Approve the solution doc + mark the solution published. Writes the approval version. */
export function publishSolution(solutionId: string) {
  const doc = ensureSolutionDocAsset(solutionId);
  const version = writeVersion(doc.id, doc.bodyMd || getAsset(doc.id)!.bodyMd, "human");
  setAssetStatus(doc.id, "approved");
  updateSolution(solutionId, { status: "published" });
  return { docAssetId: doc.id, version };
}

// ---------- Generation jobs ----------

export function createJob(input: { assetId?: string; engine: string; model?: string }) {
  const j = { id: id(), assetId: input.assetId ?? null, engine: input.engine, status: "running" as const, error: null, model: input.model ?? null, tokensIn: null, tokensOut: null, costUsd: null, attempts: 1, startedAt: now(), finishedAt: null };
  db.insert(schema.generationJobs).values(j).run();
  return j.id;
}

export function finishJob(jobId: string, result: { status: "succeeded" | "failed"; error?: string; tokensIn?: number; tokensOut?: number; costUsd?: number }) {
  db.update(schema.generationJobs)
    .set({ status: result.status, error: result.error ?? null, tokensIn: result.tokensIn ?? null, tokensOut: result.tokensOut ?? null, costUsd: result.costUsd ?? null, finishedAt: now() })
    .where(eq(schema.generationJobs.id, jobId))
    .run();
}

// ---------- Brand vault ----------

export function listVault() {
  return db.select().from(schema.brandVault).orderBy(desc(schema.brandVault.updatedAt)).all();
}

export function getVaultEntry(entryId: string) {
  return db.select().from(schema.brandVault).where(eq(schema.brandVault.id, entryId)).get();
}

export function createVaultEntry(input: { kind: VaultEntry["kind"]; title: string; contentMd: string }) {
  const e = { id: id(), kind: input.kind, title: input.title, contentMd: input.contentMd, active: true, version: 1, createdAt: now(), updatedAt: now() };
  db.insert(schema.brandVault).values(e).run();
  return e;
}

export function updateVaultEntry(entryId: string, patch: Partial<Pick<VaultEntry, "title" | "contentMd" | "active">>) {
  const current = getVaultEntry(entryId);
  if (!current) return;
  const contentChanged = patch.contentMd !== undefined && patch.contentMd !== current.contentMd;
  db.update(schema.brandVault)
    .set({ ...patch, version: contentChanged ? current.version + 1 : current.version, updatedAt: now() })
    .where(eq(schema.brandVault.id, entryId))
    .run();
}

/** The pack every engine prompt inherits: all active docs + rules, newest last. */
export function getActivePack() {
  const entries = db.select().from(schema.brandVault).where(eq(schema.brandVault.active, true)).all();
  const docs = entries.filter((e) => e.kind === "doc");
  const rules = entries.filter((e) => e.kind === "rule");
  const parts = [
    ...docs.map((d) => `# ${d.title}\n\n${d.contentMd}`),
    ...(rules.length ? [`# Standing rules\n\n${rules.map((r) => `- ${r.contentMd}`).join("\n")}`] : []),
  ];
  return parts.join("\n\n---\n\n");
}

// ---------- Media ----------

export function createMedia(input: { solutionId?: string; kind: Media["kind"]; storageKey: string; mime: string; alt?: string }) {
  const m = { id: id(), solutionId: input.solutionId ?? null, kind: input.kind, storageKey: input.storageKey, mime: input.mime, alt: input.alt ?? null, caption: null, createdAt: now() };
  db.insert(schema.media).values(m).run();
  return m;
}

export function getMedia(mediaId: string) {
  return db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
}

export function listMediaForSolution(solutionId: string) {
  return db.select().from(schema.media).where(eq(schema.media.solutionId, solutionId)).orderBy(desc(schema.media.createdAt)).all();
}

// ---------- Publications ----------

export type Publication = typeof schema.publications.$inferSelect;

export function listPublicationsForAsset(assetId: string) {
  return db.select().from(schema.publications).where(eq(schema.publications.assetId, assetId)).all();
}

export function markPublished(assetId: string, platform: string, url: string) {
  const existing = db
    .select()
    .from(schema.publications)
    .where(and(eq(schema.publications.assetId, assetId), eq(schema.publications.platform, platform)))
    .get();
  if (existing) {
    db.update(schema.publications).set({ status: "live", url, publishedAt: now() }).where(eq(schema.publications.id, existing.id)).run();
    return existing.id;
  }
  const pid = id();
  db.insert(schema.publications).values({ id: pid, assetId, platform, status: "live", url, publishedAt: now() }).run();
  return pid;
}

/** Live URLs for a solution keyed by asset type, feeds {{blog_url}}/{{page_url}} token resolution. */
export function liveUrlsForSolution(solutionId: string): Partial<Record<"blog" | "page", string>> {
  const rows = listAssetsForSolution(solutionId);
  const out: Partial<Record<"blog" | "page", string>> = {};
  for (const type of ["blog", "page"] as const) {
    const asset = rows.find((a) => a.type === type);
    if (!asset) continue;
    const canonical = type === "blog" ? "brutal_blog" : "site";
    const pubs = listPublicationsForAsset(asset.id).filter((p) => p.status === "live" && p.url);
    const live = pubs.find((p) => p.platform === canonical) ?? pubs[0];
    if (live?.url) out[type] = live.url;
  }
  return out;
}

export function setPublicationMetrics(publicationId: string, metrics: { views?: number; clicks?: number; notes?: string }) {
  db.update(schema.publications)
    .set({ metricsJson: JSON.stringify({ ...metrics, recordedAt: now() }) })
    .where(eq(schema.publications.id, publicationId))
    .run();
}

export function recentPublications(limit = 8) {
  return db.select().from(schema.publications).where(eq(schema.publications.status, "live")).orderBy(desc(schema.publications.publishedAt)).limit(limit).all();
}

// ---------- Clients ----------

export type Client = typeof schema.clients.$inferSelect;

export function listClients() {
  return db.select().from(schema.clients).orderBy(desc(schema.clients.createdAt)).all();
}

export function getClient(clientId: string) {
  return db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).get();
}

export function createClient(input: { name: string; contact?: string; permission?: Client["permission"]; factsJson?: string; logoMediaId?: string }) {
  const c = { id: id(), name: input.name, logoMediaId: input.logoMediaId ?? null, contact: input.contact ?? null, permission: input.permission ?? ("none" as const), factsJson: input.factsJson ?? null, createdAt: now() };
  db.insert(schema.clients).values(c).run();
  return c;
}

export function updateClient(clientId: string, patch: Partial<Pick<Client, "name" | "contact" | "permission" | "factsJson" | "logoMediaId">>) {
  db.update(schema.clients).set(patch).where(eq(schema.clients.id, clientId)).run();
}

export function attachClientToSolution(solutionId: string, clientId: string | null) {
  db.update(schema.solutions).set({ clientId, updatedAt: now() }).where(eq(schema.solutions.id, solutionId)).run();
}

// ---------- Edit diffs (voice-loop training data) ----------

export function insertEditDiff(assetId: string, draftMd: string, finalMd: string) {
  db.insert(schema.editDiffs).values({ id: id(), assetId, draftMd, finalMd, distilledRuleId: null, processedAt: null, createdAt: now() }).run();
}

export function listUnprocessedDiffs() {
  return db.select().from(schema.editDiffs).where(isNull(schema.editDiffs.processedAt)).all();
}

export function markDiffProcessed(diffId: string, distilledRuleId: string | null) {
  db.update(schema.editDiffs).set({ processedAt: now(), distilledRuleId }).where(eq(schema.editDiffs.id, diffId)).run();
}

// ---------- Jobs & cost ----------

export function listJobs(limit = 50) {
  return db.select().from(schema.generationJobs).orderBy(desc(schema.generationJobs.startedAt)).limit(limit).all();
}

export function totalCost() {
  const jobs = db.select().from(schema.generationJobs).all();
  let usd = 0;
  for (const j of jobs) usd += j.costUsd ?? 0;
  return usd;
}

export function costForSolution(solutionId: string) {
  const assetIds = new Set(listAssetsForSolution(solutionId).map((a) => a.id));
  let usd = 0;
  for (const j of db.select().from(schema.generationJobs).all()) {
    if (j.assetId && assetIds.has(j.assetId)) usd += j.costUsd ?? 0;
  }
  return usd;
}

export function costForAsset(assetId: string) {
  let usd = 0;
  for (const j of db.select().from(schema.generationJobs).where(eq(schema.generationJobs.assetId, assetId)).all()) {
    usd += j.costUsd ?? 0;
  }
  return usd;
}

/** Generation spend since the first of the current month, for the budget bar. */
export function costThisMonth() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const cutoff = start.getTime();
  let usd = 0;
  for (const j of db.select().from(schema.generationJobs).all()) {
    if ((j.startedAt ?? 0) >= cutoff) usd += j.costUsd ?? 0;
  }
  return usd;
}

/** Rough cost from token counts; override prices via env when models change. */
export function estimateCostUsd(tokensIn: number, tokensOut: number) {
  const inPer1M = Number(process.env.LLM_PRICE_IN_PER_MTOK || 3);
  const outPer1M = Number(process.env.LLM_PRICE_OUT_PER_MTOK || 15);
  return (tokensIn / 1_000_000) * inPer1M + (tokensOut / 1_000_000) * outPer1M;
}

// ---------- Cross-solution asset queries (command center) ----------

export function listAllAssets() {
  return db.select().from(schema.assets).all();
}

/** Case-study page templates. Each lives under title "casestudy:template:<slug>"; the default slug under "casestudy:default-template". */
export function listCaseStudyTemplates() {
  return db
    .select()
    .from(schema.brandVault)
    .where(and(eq(schema.brandVault.kind, "prompt_override"), eq(schema.brandVault.active, true)))
    .all()
    .filter((e) => e.title.startsWith("casestudy:template:"))
    .map((e) => ({ slug: e.title.replace("casestudy:template:", ""), spec: e.contentMd }));
}

export function getCaseStudyTemplate(slug: string) {
  return listCaseStudyTemplates().find((t) => t.slug === slug) ?? null;
}

export function getDefaultCaseStudyTemplateSlug() {
  const entry = db
    .select()
    .from(schema.brandVault)
    .where(and(eq(schema.brandVault.kind, "prompt_override"), eq(schema.brandVault.title, "casestudy:default-template")))
    .get();
  return entry?.contentMd.trim() ?? listCaseStudyTemplates()[0]?.slug ?? null;
}

/** The case-study format pack (customer-story anatomy). Stored under title "casestudy:format". */
export function getCaseStudyPack() {
  const entry = db
    .select()
    .from(schema.brandVault)
    .where(and(eq(schema.brandVault.kind, "prompt_override"), eq(schema.brandVault.active, true), eq(schema.brandVault.title, "casestudy:format")))
    .get();
  return entry?.contentMd ?? null;
}

/** The GEO/SEO pack injected into long-form engines (blog, page, case study). Stored under title "geo:longform". */
export function getGeoPack() {
  const entry = db
    .select()
    .from(schema.brandVault)
    .where(and(eq(schema.brandVault.kind, "prompt_override"), eq(schema.brandVault.active, true), eq(schema.brandVault.title, "geo:longform")))
    .get();
  return entry?.contentMd ?? null;
}

export function getPromptOverride(engine: string) {
  const entry = db
    .select()
    .from(schema.brandVault)
    .where(and(eq(schema.brandVault.kind, "prompt_override"), eq(schema.brandVault.active, true), eq(schema.brandVault.title, `override:${engine}`)))
    .get();
  return entry?.contentMd ?? null;
}
