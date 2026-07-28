# Brutal Content Engine

Brutal's master content generation dashboard. A Solution goes in; a full campaign comes out: blog post, solutions page, tweet, LinkedIn post, and a templated case study, every asset reviewable, regenerable, and aware of when it is out of date.

## Layout

- `engine/` - the Next.js 16 app (SQLite via Drizzle, Claude API behind a provider adapter, Flux image generation via BFL)
- `brand/` - the source-of-truth editorial packs: style pack, GEO pack, case-study pack, four case-study templates, and the hallmark blog post
- `.claude/` - project skills (15 GEO/SEO audit skills), agents, and the dev-server launch config

## Run it

```bash
cd engine
npm install
cp .env.local.example .env.local   # add ANTHROPIC_API_KEY (and BFL_API_KEY for images)
npm run seed                        # seeds the Brand Vault from brand/
npm run dev
```

## Architecture in one paragraph

Everything is a content graph. The published solution doc is the root asset; every generated asset records which upstream asset and version it came from. Publishing a solution auto-drafts the blog; approving the blog fans out the solutions page, tweet, and LinkedIn post, and the case study once a client record with recorded facts is attached. Approving an upstream version flips downstream assets stale. Every generation is a persisted job with tokens and cost. Copy exports resolve `{{blog_url}}` and `{{page_url}}` tokens from real publication records, so social replies never ship invented links. The Brand Vault (editorial style pack, standing rules, GEO pack, case-study templates) conditions every prompt; its closed-world rule means engines mark missing facts as `[MISSING: ...]` instead of inventing them.

## Later

`engine/RUNBOOK-supabase-swap.md` documents the SQLite to Supabase + Vercel migration (blocked on billing), and the LLM provider adapter has a slot for Brutal OS.
