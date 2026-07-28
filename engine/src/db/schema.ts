import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

// The content graph. The published solution doc is itself an asset (type 'solution'),
// so the cascade's root edge exists, the solutions table only holds intake material.

export const solutions = sqliteTable("solutions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  dumpRaw: text("dump_raw"),
  links: text("links"), // newline-separated URLs from the info-dump
  interviewLog: text("interview_log"), // JSON: [{role, content, at}]
  clientId: text("client_id"), // unblocks the case-study engine when set
  createdBy: text("created_by").notNull().default("antonio"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const ASSET_TYPES = ["solution", "blog", "page", "tweet", "linkedin", "case_study"] as const;
export const ASSET_STATUSES = ["blocked", "generating", "failed", "draft", "stale", "approved"] as const;

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  solutionId: text("solution_id"),
  type: text("type", { enum: ASSET_TYPES }).notNull(),
  status: text("status", { enum: ASSET_STATUSES }).notNull().default("draft"),
  bodyMd: text("body_md").notNull().default(""),
  metaJson: text("meta_json"), // variants, slots, platform formats
  sourceAssetId: text("source_asset_id"), // DAG edge
  sourceVersion: integer("source_version"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Written on regenerate and on approval; intermediate saves are working state.
export const assetVersions = sqliteTable("asset_versions", {
  id: text("id").primaryKey(),
  assetId: text("asset_id").notNull(),
  version: integer("version").notNull(),
  bodyMd: text("body_md").notNull(),
  author: text("author", { enum: ["ai", "human"] }).notNull(),
  createdAt: integer("created_at").notNull(),
});

export const generationJobs = sqliteTable("generation_jobs", {
  id: text("id").primaryKey(),
  assetId: text("asset_id"),
  engine: text("engine").notNull(),
  status: text("status", { enum: ["queued", "running", "succeeded", "failed"] }).notNull().default("queued"),
  error: text("error"),
  model: text("model"),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  costUsd: real("cost_usd"),
  attempts: integer("attempts").notNull().default(1),
  startedAt: integer("started_at"),
  finishedAt: integer("finished_at"),
});

// Resolves {{blog_url}}-style tokens and feeds "recently published".
export const publications = sqliteTable("publications", {
  id: text("id").primaryKey(),
  assetId: text("asset_id").notNull(),
  platform: text("platform").notNull(), // brutal_blog | medium | substack | hn | x | linkedin | site
  status: text("status", { enum: ["planned", "live"] }).notNull().default("planned"),
  url: text("url"),
  publishedAt: integer("published_at"),
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoMediaId: text("logo_media_id"),
  contact: text("contact"),
  permission: text("permission", { enum: ["none", "verbal", "written"] }).notNull().default("none"),
  factsJson: text("facts_json"), // metrics, quotes, timeline, the ONLY source the case-study engine may use
  createdAt: integer("created_at").notNull(),
});

export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  solutionId: text("solution_id"),
  kind: text("kind", { enum: ["screenshot", "clip", "logo", "photo", "infographic"] }).notNull(),
  storageKey: text("storage_key").notNull(), // filename under data/media; referenced as media://<id>
  mime: text("mime").notNull(),
  alt: text("alt"),
  caption: text("caption"),
  createdAt: integer("created_at").notNull(),
});

export const assetMedia = sqliteTable(
  "asset_media",
  {
    assetId: text("asset_id").notNull(),
    mediaId: text("media_id").notNull(),
    slot: text("slot").notNull(),
    status: text("status", { enum: ["briefed", "fulfilled"] }).notNull().default("briefed"),
  },
  (t) => [primaryKey({ columns: [t.assetId, t.mediaId, t.slot] })]
);

export const brandVault = sqliteTable("brand_vault", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["doc", "rule", "prompt_override"] }).notNull(),
  title: text("title").notNull(),
  contentMd: text("content_md").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Captured from Phase 2 approvals onward; distilled into rules by the Phase 4 voice loop.
export const editDiffs = sqliteTable("edit_diffs", {
  id: text("id").primaryKey(),
  assetId: text("asset_id").notNull(),
  draftMd: text("draft_md").notNull(),
  finalMd: text("final_md").notNull(),
  distilledRuleId: text("distilled_rule_id"),
  processedAt: integer("processed_at"),
  createdAt: integer("created_at").notNull(),
});
