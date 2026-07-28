# Runbook — SQLite → Supabase + Vercel deploy (Phase 4, blocked on billing)

Blocked until the Supabase account is unpaused. Everything below was designed for
this swap: data access goes through `src/db/repo.ts`, files are referenced by
stable `media://<id>` ids, and each generation runs as its own API-route invocation.

## 1. Supabase project
- Restore billing → create project `brutal-content-engine`.
- Recreate the schema: `src/db/schema.ts` is dialect-portable Drizzle; generate
  Postgres DDL with drizzle-kit (`dialect: "postgresql"`) and apply as a migration.
  Watch the three SQLite-isms: integer timestamps (keep as `bigint` or move to
  `timestamptz`), `integer(mode: "boolean")` → `boolean`, and the additive
  `client_id` ALTER (fold it into the base DDL).

## 2. Data migration (the back-catalog matters — do not start empty)
- Export: `sqlite3 data/engine.db .dump` → transform inserts, or script a
  row-copy per table with drizzle (read SQLite, write Postgres) — tables are
  small (markdown rows), one evening of care, verify counts per table.
- Media files: upload `data/media/*` to a Supabase Storage bucket `media`,
  key = existing `storage_key`. Bodies reference `media://<id>` so nothing in
  content breaks; swap the filesystem read/write in `src/db/client.ts` (MEDIA_DIR)
  and `/api/media` for Storage calls behind the same helper.

## 3. Driver swap
- `src/db/client.ts`: replace better-sqlite3 with `drizzle-orm/postgres-js` +
  connection string from `DATABASE_URL`. Repo layer stays untouched — that was
  the point. Note repo functions are currently sync (better-sqlite3); the
  Postgres driver is async, so add `await` at repo call sites (mechanical,
  TypeScript will point at every one).

## 4. Vercel + team access
- Deploy `engine/` to Vercel; env vars: ANTHROPIC_API_KEY, DATABASE_URL,
  OPENAI_API_KEY (images), LLM_* overrides.
- Generation routes already run per-invocation; set function `maxDuration` ≥ 300s
  for /api/draft-doc and the approve/fan-out server action.
- Auth: Supabase Auth with magic links, workspace = Brutal team; add a users
  table + `created_by`/actor columns at the same time (they gain meaning only now).

## 5. Brutal OS port (when its API details arrive)
- Implement `BrutalOsProvider` in `src/lib/llm/` (interface already there),
  set `LLM_PROVIDER=brutal-os` + its key. Same for images if the OS offers it.
