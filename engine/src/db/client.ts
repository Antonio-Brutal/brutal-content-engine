import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// SQLite today, Supabase Postgres later: everything above this file talks to the
// repository layer, so the swap is a driver change, not a rewrite.

const DATA_DIR = path.join(process.cwd(), "data");
export const MEDIA_DIR = path.join(DATA_DIR, "media");

function bootstrap(sqlite: Database.Database) {
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS solutions (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
      dump_raw TEXT, links TEXT, interview_log TEXT,
      created_by TEXT NOT NULL DEFAULT 'antonio', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY, solution_id TEXT, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
      body_md TEXT NOT NULL DEFAULT '', meta_json TEXT, source_asset_id TEXT, source_version INTEGER,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS asset_versions (
      id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, version INTEGER NOT NULL,
      body_md TEXT NOT NULL, author TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY, asset_id TEXT, engine TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
      error TEXT, model TEXT, tokens_in INTEGER, tokens_out INTEGER, cost_usd REAL,
      attempts INTEGER NOT NULL DEFAULT 1, started_at INTEGER, finished_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned', url TEXT, published_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, logo_media_id TEXT, contact TEXT,
      permission TEXT NOT NULL DEFAULT 'none', facts_json TEXT, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY, solution_id TEXT, kind TEXT NOT NULL, storage_key TEXT NOT NULL,
      mime TEXT NOT NULL, alt TEXT, caption TEXT, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS asset_media (
      asset_id TEXT NOT NULL, media_id TEXT NOT NULL, slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'briefed', PRIMARY KEY (asset_id, media_id, slot)
    );
    CREATE TABLE IF NOT EXISTS brand_vault (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, content_md TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS edit_diffs (
      id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, draft_md TEXT NOT NULL, final_md TEXT NOT NULL,
      distilled_rule_id TEXT, processed_at INTEGER, created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_assets_solution ON assets(solution_id);
  `);
  // additive migrations for rows created before a column existed
  try {
    sqlite.exec(`ALTER TABLE solutions ADD COLUMN client_id TEXT`);
  } catch {
    /* column already exists */
  }
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_versions_asset ON asset_versions(asset_id);
    CREATE INDEX IF NOT EXISTS idx_media_solution ON media(solution_id);
  `);
}

declare global {
  // eslint-disable-next-line no-var
  var __brutalDb: ReturnType<typeof createDb> | undefined;
}

function createDb() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const sqlite = new Database(path.join(DATA_DIR, "engine.db"));
  bootstrap(sqlite);
  return drizzle(sqlite, { schema });
}

export const db = globalThis.__brutalDb ?? (globalThis.__brutalDb = createDb());
export { schema };
