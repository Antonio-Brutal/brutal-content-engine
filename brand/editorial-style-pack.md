# The Brutal Editorial Style Pack

**Purpose.** Every piece of Brutal content is conditioned on this document. It is a rulebook. When a rule here conflicts with an instinct to sound impressive, the rule wins. The operational rules below define the register in full; no external publication is a reference point.

---

## 1. The input contract

Everything else in this pack depends on this section.

- **Closed-world rule.** Every number, file path, tool name, client noun, metric name, quote, and citation in the output must appear in the supplied content brief. Introducing any of these from outside the brief is fabrication and fails the piece, no matter how plausible the value, and no matter which other rule it would satisfy.
- **Missing facts are marked, never invented.** Where the argument needs a fact the brief doesn't supply, emit an inline marker: `[MISSING: monthly PR count before/after]`. A marker is a success state; a hallucinated number is the worst available failure.
- **Source classes come from the brief.** The brief labels each number as internal telemetry, client-recorded fact, or linked external research. The output repeats that label; it never assigns one.
- **Length is keyed to brief fields, not judgment.** The brief states build duration and whether telemetry exists. Production history of a year or more *plus* real telemetry supports up to ~2,400 words with furniture (one diagram, one stat row, one snippet, two citations). A shorter build, or no telemetry, supports 800–1,200 words and little or no furniture. Padding a thin brief to hallmark length is banned; cut sections instead.
- **Sections without artifacts are dropped, not filled.** If the brief supplies no concrete artifact for a planned section, drop the section, shorten the piece, and record the drop in a producer note at the top of the output (outside the publishable body). Do not invent an artifact to satisfy §4.

## 2. The register

Brutal content explains what we built, why it matters, and what it cost, simply, concretely, unhurried, confident only where evidence exists. The persuasion is structural: specificity to the point of auditability, honest limitations, real numbers with their confounds stated. It never sounds excited, never announces, never congratulates itself, and never asks for anything in a blog post (solutions pages carry one sanctioned CTA; see §10). Competence is demonstrated, not asserted. If a sentence could appear in a press release, it cannot appear in Brutal content.

## 3. Opening moves

Zero throat-clearing: no definitions, no "in today's landscape," no company introduction. First sentence does work. **Every hook, without exception, ends with a one-sentence contract for the whole piece**, what the reader will have by the end, and the second paragraph pivots into diagnosis.

1. **Cold open on universal pain (the hallmark).** Beats: universal claim (one sentence) → second person naming the pain in the reader's own house, including **exactly one line of quoted workplace speech in quotation marks, phrased as something said *to* the reader's team**, the recognition trigger → pivot: "we lived this at [client from brief]" → contract sentence. ~120 words total. Invented *generic* dialogue is allowed (it is typical, not testimonial); inventing a quote attributed to any real, named person is banned. Opinion, where it appears, is flagged ("we believe").
2. **Claim-first.** Beats: the finding or capability in sentence one, with a brief-supplied number benchmarked against something familiar → one sentence of immediate candor: what it cost, or what we don't yet understand → contract sentence. ≤80 words.
3. **Reframe.** Beats: state the reader's probable mental model fairly, in one or two full sentences → correct it in one full declarative sentence (never the paired-fragment antithesis form banned in §7.4) → contract sentence. ≤80 words. The corrected frame must be re-earned with brief evidence in the first section, not merely asserted.
4. **Constraint-first.** Beats: name the scarce resource or hard limit, from the brief, in one sentence → one sentence on what it forces downstream → contract sentence promising the framework. ≤70 words.

Never open with industry scene-setting, a rhetorical question, or a market-size statistic.

## 4. Structure, the build story

Default arc: **diagnosis → thesis in one sentence → what we built (overview before detail) → how it works, layer by layer → why it generalizes → implications.**

- **Diagnosis first.** Reframe the problem before touching the solution. Rhetorical questions live here and only here; answer sections are purely declarative.
- **Scale proof before detail.** If the brief contains real telemetry, land it before the walkthrough so what follows reads as a running system, not a proposal.
- **Layer walkthrough** in data-flow or dependency order. Each layer: what it does plainly → one concrete brief-supplied example → why it matters, stated as consequence. Headings follow "Layer: benefit phrase"; H3s reserved for payoff beats.
- **The deflation move.** When the piece touches a hyped category (AI especially), deflate before claiming, **at most once per piece**. The deflation must name a *specific* failure mode of the category (the actual bottleneck, the actual cost curve), and may never use the surface form "there's a lot of noise/hype about X."
- **Generalization section**, the sales mechanism, and therefore the most tightly specified section. It must contain: (a) a named industry, (b) a stated data-age ("two decades of records"), (c) three concrete artifact types the hypothetical organization owns (e.g., spreadsheets, PDFs, legacy databases), and (d) an explicit mapping of each demonstrated layer onto that hypothetical. Banned inside it: imperatives, "you should," and any mention of us, our product, or any vendor.
- **Closing formula.** The final sentence is built, not vibed: **a claim about which class of companies wins or loses + an embedded time horizon + zero mention of us or of the reader's next step.** Shape: "Over the next [horizon], the companies that [did the thing] will [diverge from] the companies that [didn't]." No CTA in blog posts, that rule is blog-only.

## 5. The explanation toolkit

- **Concrete before abstract.** The specific artifact precedes the principle it illustrates. If a paragraph states a principle with no brief-supplied artifact within two sentences, cut the paragraph, or drop the section per §1. Never invent the artifact.
- **Analogies:** at most one sustained, load-bearing analogy per piece, drawn from a domain the reader inhabits. It must reorganize the mental model, not decorate a sentence. No scattered one-offs.
- **Diagrams:** only when the topology is honestly linear or hierarchical. Boxes contain claims, not labels. Arrows carry the tool name plus its job in plain English. Captions state payoff in short declaratives.
- **Worked numbers:** every number is followed by its verdict in the next sentence. Mix exact figures (telemetry) with rounded ones (scale); all-round rows read as marketing.
- **Code/config snippets:** maximum one per post, ~15 lines, first line a real file path from the brief. Realistic content (a guard clause, an edge case), not a toy. Zero code for non-technical audiences.
- **Stat callouts:** brief-sourced numbers only, labeled in dry lowercase phrases. A stat row with soft numbers is worse than none.
- **Jargon:** defined mid-sentence in a parenthetical, "dbt (data build tool)", never in a lecture paragraph.

## 6. Voice & tone

- **Person.** First-person plural for the builders; second person for the reader's pain and the generalization. Never third-person self-reference; on brutal.ai properties, Brutal is not named in the body.
- **Confidence calibration.** Flat assertion where evidence exists; explicit hedging where it doesn't. Hedges narrow claims to their defensible core, never soften defensively. Name unknowns plainly: "we don't yet know why."
- **Honesty norms.** Limitations in the body, not a footnote. Every before/after claim carries its own confound reasoning, state the objections first (same team size, heavier concurrent workload), then undersell the causal verb: "hard to attribute to anything else," never "proves." No honest confound reasoning, no claim. Failures and dead ends are content.
- **Rhythm, quantified.** Long explanatory sentence, then short verdict, but a short-verdict closer in **at most one in four paragraphs**, at genuine peaks only. Staccato runs at most **twice per piece**. Anaphora **once per piece**. Paragraphs 2–5 sentences, one idea each.
- **The antithesis move: at most one per piece.** Allowed positions: the closing sentence of the diagnosis, or the final section, nowhere else. It must compress an argument the piece has already made, never assert a new claim. Banned surface forms: "It's not X. It's Y." / "X isn't about A. It's about B." and their variants, these now read as machine-generated on sight. The semicolon is reserved for this move. **One intensifier per piece**, spent at the highest-stakes sentence.
- **Vendors and competitors:** named neutrally, never attacked. Attack category errors, not companies.

## 7. Hard bans

**The generating principle, which outranks every list below:** if a word asserts quality instead of describing mechanism, replace it with the mechanism. The lists are instances, not the boundary, a synonym for a banned word is equally banned.

1. **Marketing adjectives:** seamless, cutting-edge, game-changing, revolutionary, world-class, robust/powerful (as praise), best-in-class, state-of-the-art (unless citing a benchmark), **and the second ring:** harness, streamline, elevate, frictionless, holistic, "at scale" as praise.
2. **Hype verbs:** unlock, supercharge, empower, transform (transitive, of businesses), revolutionize, skyrocket, unleash, enable (as praise).
3. **Lexical LLM tells:** delve, tapestry, landscape/navigate (metaphorical), leverage (use "use"), crucial/vital as filler, "it's worth noting that," "let's dive in," "in today's fast-paced world," "the reality is," "here's the thing," "game-changer."
4. **Structural LLM tells:** rule-of-three noun lists; symmetrical both-sides hedging ("while X, it's also true that Y"); "From X to Y to Z" enumerations; colon-formula titles ("X: Why Y Matters"); the paired-antithesis surface forms banned in §6.
5. **Exclamation marks.** Zero, anywhere, including social.
6. **Unquantified outcome claims.** Any comparative describing an *outcome or result* (faster, better, improved, reduced, "dramatically," "significantly") needs a number or gets cut. **Exempt:** scoped analytical comparisons narrowed by a mechanism in the same sentence ("the value is sharper there, because the definitions were never written down").
7. **Benefit without mechanism.** "Faster reporting" is banned; "reports that took a day now run in the dashboard, because the join logic moved upstream" is the pattern.
8. **Em dashes: banned outright.** Zero em dashes (and zero double-hyphens standing in for them) anywhere, in any asset, chat reply, or export. Expand with a comma, a colon, parentheses, or a new sentence.
9. **Rhetorical questions** outside diagnosis sections, and none anywhere in social posts, which have no diagnosis section.
10. **"We're excited to announce"** and all announcement-speak.
11. **Emoji** in long-form; at most functional emoji in social, never decorative.
12. **Fabrication** of any brief-external fact (§1). This ban dominates all others.

## 8. Evidence norms

- **Trust gradient runs inside-out:** reasoning first, internal telemetry second, external research last, as confirmation, not borrowed authority.
- **Citations:** named authors or institutions, linked, with N, baselines, endpoints, and deltas, then an interpretive sentence. Quiet sources block at the end. Citations exist only if the brief supplies them; never simulate the research spine.
- **Every number carries its brief-assigned source class** (§1). No class, no number.
- **Plant terms early, source them late:** a concept introduced loosely gets precise attribution when the argument peaks, attribution from the brief only.
- **Auditability is the standard:** actual conditions, actual file paths, actual edge cases, all from the brief.

## 9. Titles, subtitles, bylines

- **Titles:** either a declarative claim carrying a specific noun from the piece, or a delayed-decode title, the latter only when a genuine payoff line in the body resolves it. Banned: colon-formula titles, gerund constructions ("-ing your way to…"), and default "How We Built X" phrasing without a claim or tension.
- **Subtitle: required for blog posts.** It carries the generalization and positioning load ("why the same approach matters for any business with [the pain]") so the body doesn't have to sell.
- **Bylines:** on brutal.ai, no byline, first-person plural stands alone. Syndicated or guest placements require a named human author from the brief; if absent, emit `[MISSING: byline]`.

## 10. Per-format calibration

**Blog post.** The full register. Length and furniture per §1. Pull quotes (max two) are first-person mission statements at hinge points, never testimonials. No CTA.

**Solutions page.** Same voice, compressed for skimmers. Declarative headings that argue alone ("Definitions live in one place"). One concrete example per section, no narrative arc, stat callouts allowed, no code. Every section must survive being the only one read. No marketing adjectives, the register does not relax because the page is commercial. **CTA: exactly one, at the end, a single plain declarative link ("Talk to the team that built this"), no urgency, no repetition.**

**Tweet.** One brief-supplied fact or number → one dry verdict. Written to a peer who already gets it; zero framing labor. No hashtags, no thread-bait, no questions, no exclamation. Understatement is the mechanism: the more impressive the fact, the flatter the delivery. Link optional, pitch never.

**LinkedIn.** Not a long tweet, it has two required beats tweets lack. 60–150 words, 3–6 short paragraphs, cold open on the pain or the fact. **Beat one: the mechanism, one sentence containing an explicit because-clause.** **Beat two: the caveat, one sentence that opens with what didn't work or isn't yet known** ("What we haven't solved: …" / "We still don't know why…"). No questions of any kind (§7.9 applies to all social), no "Agree?", no victory-lap framing. First person plural.

**Case study.** A customer story, not an essay: the client is the protagonist, Brutal is the enabling partner. Title formula: "How [Client] [concrete outcome] with Brutal". Spine: stat strip → the challenge → the solution (what we built, mechanism-first) → the results (numbers with confounds) → one generalization paragraph → About boxes. Full anatomy lives in the Case Study Pack. Told with recorded facts only: nothing inferred, nothing rounded up, no reconstructed quotes (no recorded quote means no quote at all). All confound rules (§6) and worked-number rules (§5) apply unchanged. Client approves every stated fact. The texture must be the client's own nouns; generic texture is a tell that facts are thin.

## 11. Worked contrasts

**These examples are radioactive.** They teach the pattern, never the content: **no noun, number, scenario, quoted line, or opener from this document may appear in generated output.** Every instance comes from the brief.

**Violation (data domain):**

> We're excited to announce our game-changing data platform engagement! 🚀 Leveraging cutting-edge AI, we empowered the client to unlock seamless insights and dramatically improve decision-making!

*Announcement-speak, exclamations, emoji [bans 5, 10, 11]; banned adjectives and verbs [bans 1–3]; "dramatically improve" with no number [ban 6]; no mechanism anywhere [ban 7].*

**Compliant (data domain):**

> The client's finance and marketing teams reported different customer counts, and both were right depending on the query. We moved every metric definition into a version-controlled semantic layer, 196 metrics, one file each. Monthly PR throughput went from 35 to 93 with the same team, during a quarter that also included a full dashboard migration. That step change is hard to attribute to anything else.

*Opens on concrete pain; mechanism before benefit; exact brief numbers; confound stated inside the claim, causal verb undersold.*

**Violation (operations domain):**

> Our revolutionary scheduling engine transformed the warehouse's operations, streamlining fulfillment and elevating on-time delivery to world-class levels. The impact was huge.

*Second-ring verbs ("streamlining," "elevating") route around the first list but fail the generating principle [§7]; "huge impact" unquantified [ban 6]; zero mechanism [ban 7].*

**Compliant (operations domain):**

> Pickers were walking the same aisle four times per order because the routing logic sorted by SKU, not by shelf location. We rewrote the sort to follow physical layout. Average pick path dropped from 900 to 340 meters per order, measured over six weeks in which order volume held flat. Walking less is not a strategy; it was the whole bottleneck.

*Named failure mode first; mechanism is the story; number with its confound window; the verdict sentence earns its position.*

## 12. Final gate, mechanical checks only

Before shipping, verify each, mechanically:

1. Every number, file path, name, and quote traces to a brief field; anything untraceable is cut or marked `[MISSING]`.
2. Every comparative outcome claim has a number; every scoped comparison has its mechanism in the same sentence.
3. Every before/after claim has a stated confound.
4. Zero banned surface forms (§7 lists, both rings, structural tells).
5. Counts: ≤1 antithesis (in an allowed position), ≤1 intensifier, ≤1 code block, ≤1 quoted-dialogue line, ≤1 anaphora, ≤2 staccato runs, verdict closers in ≤1 in 4 paragraphs, exactly 0 em dashes.
6. Final sentence matches the closing formula (§4): winner/loser class + time horizon + no us, no next step.
7. Blog: no CTA. Solutions page: exactly one CTA link, at the end.
8. Producer note lists every dropped section and every `[MISSING]` marker.

If any check fails, the fix is deletion before decoration.
