# Brutal Content Engine: Handoff

This document explains everything in this repository so another system (Brutal OS) can port it faithfully. Read it top to bottom before touching code. The companion file `PORT-PROMPT.md` is the prompt to hand the porting agent.

## 1. What this is

An internal dashboard that turns one documented "Solution" (a project Brutal built for a client) into a full content campaign: a blog post, a solutions page, a tweet thread, a LinkedIn post, and a templated case study. Humans review everything; nothing publishes itself. The system's defining property is the closed-world rule: engines may only use facts supplied in their brief, and must write `[MISSING: ...]` markers instead of inventing anything.

## 2. The content graph (core data model)

Everything is an asset in a directed acyclic graph. The published solution doc is itself an asset (type `solution`) and the root node. Every generated asset records `source_asset_id` and `source_version`, the exact upstream version it was generated from. This one design decision powers three features for free:

- Staleness cascade: approving a new version of any asset flips descendants generated from older versions to `stale`, transitively.
- Repurposing: any asset can be recast into any format; the output joins the graph as a new node (the graph stays a DAG because repurposes always create new assets).
- The command center: pipeline state is a query over the graph.

Version semantics (load-bearing): a new `asset_versions` row is written on regenerate (author `ai`) and on approval (author `human`). Intermediate saves are working state on the asset row only. Before any AI overwrite, unversioned human edits are snapshotted as a human version so nothing is ever lost.

Asset statuses: `blocked | generating | failed | draft | stale | approved`. "Published" is not an asset status; it lives in the publications table, per platform.

## 3. The pipeline (two-stage fan-out)

1. A solution is created in the Builder: info dump + links + media uploads on the left, an AI interviewer (one question at a time, chasing concrete facts and their source class) on the right, then "Draft the doc" writes the solution doc.
2. Publishing the solution approves the doc and auto-drafts the blog only.
3. Approving the blog fans out the solutions page, tweet, and LinkedIn post in parallel, and the case study if a client record is attached (otherwise the case study sits `blocked`).
4. Downstream engines read the approved blog AND the solution doc, never an unreviewed draft.

Fan-out safety rails: assets that are approved or carry unversioned edits are skipped and marked stale instead of regenerated; assets mid-generation are skipped (re-entry guard); an approval landing during a generation supersedes the in-flight result.

## 4. The engines

Six systems in `engine/src/lib/engines/`:

- `prompts.ts`: system prompts. Every engine inherits the Brand Vault pack (style pack + active standing rules). Blog, page, and case study additionally get the GEO pack. Per-engine operator overrides come from vault entries titled `override:<engine>`.
- `generate.ts`: the pipeline. `runEngine(type, solutionId, opts)` is the single entry point: persisted job, brief assembly, DAG edge pinning, edit snapshot, generation, superseded check, post-draft hooks. Also `fanOutFromBlog`, `approveAsset` (edit-diff capture + version + cascade + fan-out), `publishSolutionAndDraftBlog`, `runRepurpose`, `runAdhoc` (studio), `runBlogVariants` (two drafts + LLM judge, loser kept as a version).
- Case studies are special: they render on page templates. The engine emits a directive vocabulary (`[[logo]]`, `[[image slot="x" kind="photo|screenshot|infographic" brief="..."]]`, `:::stats`, `:::quote`, `:::sidebar`, `:::about-client`, `:::about-brutal`) that `src/components/case-study/` parses and renders as a designed page with fillable image slots. Four templates live in the vault (`casestudy:template:<slug>`): stat-led-hero (default), photo-story, quote-led, one-pager. Template resolution: explicit picker choice > template stored on the asset > facts-driven chooser (recorded quotes -> quote-led; 2+ metrics -> stat-led-hero; photos -> photo-story; thin brief -> one-pager).
- Post-draft hooks (best effort, never block): Flux auto-fill of illustrative case-study image slots (screenshots stay human-upload-only), then the compliance pass.

## 5. The Brand Vault (`/brand`, table `brand_vault`)

Three kinds:
- `doc`: long documents in every engine prompt (the Editorial Style Pack, the hallmark blog post).
- `rule`: one-line standing rules, all active rules ride into every prompt (no em dashes, absolute dates, sentence ceiling, active voice, American English, descriptive links, no stock transitions, name the model, digits with units, acronyms expanded).
- `prompt_override`: machinery entries: `override:<engine>` operator overrides, `geo:longform` (the GEO pack), `casestudy:format`, `casestudy:template:<slug>`, `casestudy:default-template`.

The source-of-truth copies live in `brand/` (style pack, GEO pack, case-study pack, templates, hallmark post, llms.txt for brutal.ai); `engine/scripts/seed.ts` and the vault UI keep the DB in sync. Content is versioned; editing bumps the version.

The voice loop: every approval where the human edited the AI draft stores a diff (`edit_diffs`). Distillation (daily timer in `src/instrumentation.ts`, or the button on /brand) turns recurring edits into proposed rules (inactive vault rules a human activates). Nothing changes generation behavior without human activation.

## 6. Quality systems

- Compliance pass (`src/lib/compliance.ts`): after every draft, a judge run scores overall / citability / hallmark (0-100) and lists concrete violations; stored on the asset (`metaJson.review`), shown on the asset panel with a re-run button.
- Edit pass: a copy-editing run that tightens without changing facts, written as a new AI version with a change summary.
- Blog variants: two drafts with different opening moves, judged; the winner becomes the working draft, the runner-up stays a version, the verdict is stored.
- German localization: faithful DE variant stored on the asset (`metaJson.de`), EN | DE toggle on the panel, stale hint when the EN body moved on. brutal.ai is German-first; this is deliberate.
- GEO: blog/page/case-study outputs carry a metadata block (meta title <=60, description <=155, slug, FAQ pairs, JSON-LD with Brutal as publisher, client `mentions` on case studies). `brand/llms.txt` is generated for brutal.ai.

## 7. Surfaces (all under `engine/src/app/`)

- `/` Command center: stat cards (awaiting review, stale, failed, blocked, month budget bar vs `BUDGET_MONTHLY_USD`), one pipeline row per solution with six status pills, needs-attention list, recently published with recorded views.
- `/solutions` inventory; `/solutions/new` the Builder (supports `?solutionId=` resume); `/solutions/[id]` the board (doc editor + versions, five engine columns, client attach, media, campaign export button, auto-refresh while generating); `/solutions/[id]/assets/[assetId]` the asset panel (designed case-study view or editor, review scores, EN|DE, version compare diff, edit pass, blog variants, regenerate, publish & export with per-platform copy and mark-published, per-asset cost, image generation).
- `/blog` and `/case-studies`: libraries of the two flagship asset types with live URLs; /blog also carries the topic planner.
- `/calendar`: published timeline + ready-to-ship list with campaign export links.
- `/studio` ad-hoc generation; `/repurpose` any asset into any format; `/clients` client records (facts, permission, logo); `/brand` the vault + voice loop.

## 8. Data model (SQLite via Drizzle, `engine/src/db/schema.ts`)

`solutions` (intake shell + client_id), `assets` (the graph), `asset_versions`, `generation_jobs` (every LLM call: status, tokens, cost), `publications` (per-platform planned|live + url + metrics_json), `clients` (permission: none|verbal|written; facts_json is the ONLY case-study source), `media` (+ `asset_media` slots), `brand_vault`, `edit_diffs`. Bootstrap DDL + additive ALTER guards live in `db/client.ts`; the repo layer (`db/repo.ts`) is the only data access path.

## 9. Providers (the porting seam)

- LLM: `src/lib/llm/` defines `LlmProvider` (configError + stream). `AnthropicProvider` implements it (claude-sonnet-5 default; note: no temperature param on Claude 5 models, and adaptive thinking consumes max_tokens, hence 16k-32k budgets). `LLM_PROVIDER` env selects; a `brutal-os` stub is ready to implement.
- Images: `src/lib/images/` defines `ImageProvider`. Flux via BFL.ai is preferred when `BFL_API_KEY` exists (async create + poll + download); OpenAI gpt-image-1 is the fallback. `brandArtDirection()` wraps prompts in Brutal's visual language (dark #020617 ground, thin strokes, lime #C6F14A accents).

## 10. Publications, exports, metrics

Marking an asset published records platform + URL. Social copy is locked until the `{{blog_url}}`/`{{page_url}}` tokens resolve from live publications (canonical platform preferred: brutal_blog for blogs, site for pages). Copy exports format per platform (Markdown, break-preserving LinkedIn text, HN title + comment). `/api/export/[solutionId]` zips the whole campaign (manifest, every asset .md, DE variants, media files). Per-publication metrics (views, clicks, notes) are recorded manually and surface on the command center and calendar.

## 11. Environment

`engine/.env.local` (never committed): `ANTHROPIC_API_KEY` (required), `BFL_API_KEY` (images), optional `LLM_PROVIDER`, `LLM_MODEL`, `LLM_LONGFORM_MODEL`, `LLM_PRICE_IN_PER_MTOK`/`OUT` (cost estimates), `IMAGE_PROVIDER`, `BFL_MODEL`, `OPENAI_API_KEY`, `BUDGET_MONTHLY_USD`.

## 12. Operational knowledge (learned the hard way)

- Claude 5 API: `temperature` is rejected; adaptive thinking is on by default and shares the max_tokens budget, so short budgets return empty text with tokens burned. Budgets are sized 16k/32k accordingly.
- better-sqlite3 is synchronous; the repo layer is sync by design. The Supabase port (async driver) means adding await at repo call sites; see `engine/RUNBOOK-supabase-swap.md`.
- Generation runs in-process behind server actions; a process restart mid-run leaves `generating` assets that the UI resolves with a "taking too long" retry after 3 minutes.
- Files are referenced only by stable `media://<id>`; storage is behind `MEDIA_DIR`, so object storage is a driver swap.
- All fourteen defects from the pre-deploy adversarial review are fixed (edit-destruction on fan-out, stale editor state, XSS in markdown and SVG serving, upload limits, disconnect persistence, canonical URL tokens, template stickiness, and more); keep those behaviors when porting.

## 13. What to preserve above all when porting

1. The closed-world rule end to end (briefs, prompts, [MISSING] markers, producer notes).
2. Version semantics and the edit-protection snapshots.
3. The two-stage fan-out with its safety rails.
4. The packs as data, not code (vault-editable, versioned).
5. The case-study directive vocabulary exactly (parser and engine must agree).
6. Recorded-facts discipline for clients (permission gates, no invented quotes).
