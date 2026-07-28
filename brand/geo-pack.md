# The Brutal GEO Pack

Operational rules for generating content that AI engines (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews) can extract and cite. These rules sit under the Brutal Editorial Style Pack. Where they collide, the style pack wins, and the closed-world rule wins over everything: every number, name, quote, and citation comes from the brief or is emitted as a `[MISSING: ...]` marker. GEO never justifies invention.

## 1. Blog posts: write for extraction

**Answer-first sections, after the hook.** The opening follows the style pack's opening moves unchanged: hook, contract sentence, pivot to diagnosis. The diagnosis section keeps its reframe shape and is the only place a rhetorical question may live. Every H2 section after that opens with a one to two sentence direct answer to the question the section exists to resolve. The first 40 to 60 words of the section must stand alone as a complete, quotable claim. Supporting detail, mechanism, and confounds follow the answer, never precede it.

**Self-contained passages.** Treat each heading-bounded block as a unit an engine may lift in isolation. Target 100 to 200 words per block. In each block: name the subject explicitly in the first sentence (no "it", "this", "they" as openers), never start with "But", "However", or "And", and include at least one brief-supplied concrete fact; if the brief supplies none for that block, drop the block per the style pack, never pad it. Test: delete every other block on the page; if the first sentence no longer identifies both subject and claim, rewrite the first sentence.

**Definition sentences.** Give each load-bearing term from the brief exactly one definition sentence at first use, in the pattern "X is [plain definition]." Never in the opening (the style pack bans definitions there); first use after the hook. Parentheticals still handle passing jargon per the style pack.

**Headings.** Layer-walkthrough sections keep the style pack's "Layer: benefit phrase" form. The diagnosis section may carry one question-form H2 phrased as a buyer would search it. All other headings are declarative and contain at least one noun from the brief's query or keyword field; if the brief supplies no such field, use the piece's primary subject noun and emit `[MISSING: target query]` in the producer note.

**Statistics travel with their sources.** A number, its brief-assigned source class (internal telemetry, client-recorded fact, or linked external research), and its verdict sentence live in the same passage, always. Never let an extraction boundary separate a stat from its attribution or its confound. The pattern: "[metric] went from [X] to [Y] ([source class]), during [confound from the brief]" as one extractable unit, every value from the brief.

**Structure.** Paragraphs of 2 to 5 sentences, one idea each. Tables for any comparison of three or more items. Ordered lists for sequences. These are formats engines parse with high accuracy.

## 2. Solutions pages: skimmable answer blocks

**Every section survives alone.** This is already the style pack rule; GEO raises the stakes because engines cite sections, not pages. Each section: a declarative heading that argues by itself, then a one-sentence direct answer, then the single concrete example from the brief.

**One-sentence answers before elaboration.** The first sentence under any heading must answer the implied question completely. A skimmer or an engine reading only that sentence gets the claim; everything after it is evidence.

**FAQ section shape.** End the page with an FAQ block of 4 to 8 questions as H3 headings. Use questions the brief supplies; where it supplies none, phrase questions only from claims the page already makes. These are the reader's questions, not rhetorical ones, so they are permitted. Each answer: one to three sentences, answer in the first sentence, every fact from the brief; where the brief lacks the answering fact, emit `[MISSING: ...]` or drop the question. No CTA inside answers. The page keeps exactly one CTA, after the FAQ, per the style pack.

## 3. Case studies: entity clarity

**Attribution inside the passage.** An extracted passage must carry its own attribution. Put the client's name (only if the brief marks the name as approved) in the same sentence as the headline metric, with the timeframe: "[Client]'s [metric] went from [X] to [Y] over [period]", every value from the brief. A stat in one paragraph and the client name in another produces orphaned, misattributed citations.

**Naming Brutal.** On brutal.ai properties, Brutal stays out of the body (first-person plural stands alone); the entity signal comes from metadata and JSON-LD, which is sufficient for attribution. On syndicated or gated placements, name Brutal explicitly once near the results passage. If client naming is not approved, emit `[MISSING: client name approval]` and use the brief's approved descriptor.

**Facts.** Recorded facts only, nothing inferred or rounded up, confound stated with every before/after claim, client approves every stated fact. No exceptions for citability.

## 4. Producer metadata: what the engine must emit

Append a "Platform notes" section outside the publishable body, containing:

- **Meta title**, 60 characters max. Follows the style pack title rules: a declarative claim carrying a specific noun from the piece. No colon-formula titles, no gerund constructions.
- **Meta description**, 155 characters max. Answer-first, one brief-supplied fact if available, no marketing adjectives.
- **URL slug**: 3 to 6 lowercase hyphenated words containing the primary query nouns.
- **3 to 5 FAQ Q&A pairs** (for FAQPage markup): questions per the rules in section 2, answers of one to three sentences, answer-first, every fact from the brief or marked `[MISSING]`.
- **JSON-LD Article block**, ready to paste, server-render in `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[META_TITLE]",
  "description": "[META_DESCRIPTION]",
  "url": "https://brutal.ai/blog/[SLUG]",
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "author": { "@type": "Organization", "name": "Brutal AI", "url": "https://brutal.ai" },
  "publisher": {
    "@type": "Organization", "name": "Brutal AI", "url": "https://brutal.ai",
    "logo": { "@type": "ImageObject", "url": "https://brutal.ai/[LOGO_PATH]" }
  },
  "mainEntityOfPage": "https://brutal.ai/blog/[SLUG]"
}
```

Author follows the byline rules: on brutal.ai the author is the Organization (no personal byline exists). For syndicated placements, replace author with a Person object (name, url, jobTitle, sameAs) built only from brief fields; if the brief supplies no author, emit `[MISSING: byline]` and leave the Organization author.

- **Case studies additionally**: add a `mentions` array with an Organization object for the client (`name`, `url`, from approved brief fields only), so engines bind the stats to both entities.

## 5. What not to do

- **Never invent a statistic, study, source, sameAs URL, or credential to raise citability.** A fact-dense fabricated passage is the worst possible output. `[MISSING: ...]` is the success state.
- **No keyword stuffing.** Use the query's nouns in headings, title, and slug per the placement rules above; never repeat exact-match phrases to hit density.
- **No hedge-heavy prose.** "Generally speaking", "it depends on various factors", and symmetrical both-sides hedging make passages unquotable. Hedges narrow claims to their defensible core, per the style pack.
- **No marketing language.** Banned adjectives and hype verbs fail extraction as well as the register: engines cite mechanisms and numbers, not praise.
- **No padding to GEO word benchmarks.** Brief-keyed length rules override any word-count floor. Thin brief, short piece.
- **No reconstructed quotes or simulated research spines** to imitate cited-sources patterns. Citations exist only if the brief supplies them.
- **No reuse of the style pack's worked examples.** Its nouns, numbers, and scenarios are radioactive; every concrete value in output comes from the brief.
