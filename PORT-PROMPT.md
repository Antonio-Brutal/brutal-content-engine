# Porting prompt for Brutal OS

Copy everything below the line into Brutal OS.

---

You are porting the Brutal Content Engine into Brutal OS. The complete, working reference implementation is public at:

https://github.com/Antonio-Brutal/brutal-content-engine

Step 1: clone it and read, in this order: `HANDOFF.md` (the full system explanation), `README.md`, `engine/RUNBOOK-supabase-swap.md`, and the `brand/` directory (the editorial packs are the product's soul; they are data, not code). Do not write any code before finishing `HANDOFF.md`.

Step 2: run the reference locally so you know what correct behavior looks like: `cd engine && npm install && cp .env.local.example .env.local` (add an Anthropic key), `npm run seed`, `npm run dev`. Walk one full pipeline: create a solution, draft the doc, publish (auto-drafts the blog), approve the blog (fans out page, tweet, LinkedIn), attach a client, generate a case study on a template, mark the blog published, copy an export.

Step 3: port with these seams, in this order:
1. LLM provider: implement Brutal OS's model behind the `LlmProvider` interface in `engine/src/lib/llm/` (configError + streaming). Everything above that interface must not change. Note the Claude 5 lessons in HANDOFF section 12 if Claude models are used.
2. Image provider: implement behind `ImageProvider` in `engine/src/lib/images/`, keeping `brandArtDirection()`.
3. Database: the repo layer (`engine/src/db/repo.ts`) is the only data access path. Swap SQLite for the OS's store by porting `db/client.ts` and adding await at repo call sites; the schema in `db/schema.ts` is the contract. Keep every table and column.
4. File storage: replace the `MEDIA_DIR` filesystem calls with the OS's object storage; assets reference media only by stable `media://<id>`, so nothing in content changes.
5. Auth and multi-user: the reference is single-workspace with no auth; add the OS's auth at the route layer without touching the engine core.

Step 4: migrate the seed data: run the reference's `npm run seed` equivalent against the new store, importing every file in `brand/` into the brand vault (style pack and hallmark as docs, the standing rules, `geo:longform`, `casestudy:format`, the four `casestudy:template:<slug>` entries, and `casestudy:default-template` containing `stat-led-hero`).

Non-negotiables (from HANDOFF section 13): the closed-world rule with `[MISSING: ...]` markers; version semantics (AI version on regenerate, human version on approval, snapshot unversioned edits before any AI overwrite); the two-stage fan-out with its guards (skip approved/edited/generating assets); packs stay vault-editable data; the case-study directive vocabulary byte-compatible between engine prompts and the parser; recorded-facts-only case studies with the permission gate; zero em dashes anywhere, in content and in UI.

Acceptance: the walk from Step 2 reproduces end to end on Brutal OS; a blog draft carries the GEO metadata block and three A/B headlines; a case study renders on its template with fillable image slots and the client logo; approving an edited draft captures an edit diff; regenerating an approved upstream flips descendants stale; the compliance scores appear after every draft; exports resolve URL tokens only from live publication records; and `npx tsc --noEmit` is clean.
