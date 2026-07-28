# Brutal Case Study Templates

Four page templates distilled from Figma, Airtable, GitHub, Contentful, and Asana customer stories. Default: stat-led-hero


---

## Stat-Led Hero (stat-led-hero)

When to use: Use when the brief records at least two outcome numbers with source classes, including one strong enough to carry the headline.

# Template: Stat-Led Hero

The page leads with proof: a quantified H1, a facts sidebar and stat card grid above the fold, then the story in the Brutal case study spine (challenge, solution, results, generalization, About boxes). Shape observed in the Asana/Zoom pattern: flagship stat inside the headline, outcomes strip directly under the hero image, fact rail beside the story.

## Global rules (apply to every section)

- Closed world. Every number, name, tool, system, quote, and client noun comes from the content brief. A fact the argument needs but the brief does not supply is written as an inline marker, for example [MISSING: monthly PR count before/after]. Nothing is invented, rounded up, or inferred.
- Radioactive examples. Every sample value, noun, number, and headline pattern in this spec (the sample stat lines, sample headlines, sample company or pattern names) illustrates shape only; none of it may appear in the output unless the content brief independently supplies it.
- Every number carries its brief-assigned source class (internal telemetry, client-recorded, linked external research) the first time it appears, as a short parenthetical or clause. No class, no number.
- Every before/after claim states its confound in the same or next sentence (same team size, concurrent workload) and undersells the causal verb: "hard to attribute to anything else", never "proves" or "drove".
- Zero em dashes and zero double hyphens anywhere, including stat labels, image briefs, and captions. Use a comma, colon, parentheses, or a new sentence.
- No marketing adjectives, no hype verbs, no unquantified outcome comparatives. Mechanism before benefit in every claim. If a word asserts quality instead of describing mechanism, replace it with the mechanism.
- The client is the protagonist; Brutal is the enabling partner. Use the client's own nouns (their system names, team names, artifact names) throughout. Generic texture is a tell that facts are thin; prefer cutting to padding.
- Quotes are verbatim recorded quotes only, attribution exactly as recorded. No recorded quote means no quote block at all: no paraphrase, no reconstruction.
- No CTA anywhere. The page ends on the About boxes; site chrome handles conversion.
- Rhetorical questions may appear only in the challenge section. Zero exclamation marks.

## Output skeleton, in this exact order

1. PRODUCER NOTE (first line, outside the publishable body): list every dropped optional block and every [MISSING] marker used below. Emit even when empty: "PRODUCER NOTE: nothing dropped, no markers."

2. `[[logo]]`
   Always emit, even when no logo is supplied; the renderer shows an upload space.

3. H1: `How [Client] [quantified outcome] with Brutal`
   The outcome is the single strongest recorded result number stated plainly with its unit, for example "How [Client] cut month-end close from 9 days to 2 with Brutal". If no recorded number can headline, use a concrete countable mechanism outcome, for example "How [Client] moved 196 metric definitions into one pipeline with Brutal". Never an unquantified comparative, never a hype phrase, no colon-formula titles.

4. Dek: one plain paragraph, 40 to 60 words. Sentence one names the client and the concrete pain in their own nouns. Sentence two states what was built, mechanism first. Sentence three states the headline result with its confound compressed into the sentence. No quality adjectives.

5. `:::sidebar`
   One "Field: value" line each for Industry, Size, Engagement length, Systems. Include only fields the brief supplies; drop a line rather than guess or mark it. Degradation: fewer than two supplied fields, drop the whole block and record the drop in the producer note.

6. `:::stats`
   Three or four cards, one line per card: `value | label | source class`. Values are exact recorded numbers or exact before-to-after pairs ("35 to 93"). Labels are dry lowercase phrases ("merged PRs per month"), no adjectives. Source class is the brief's label verbatim. Degradation: fewer than 2 recorded numbers with source classes, drop the grid entirely, carry any single recorded number in the dek and results prose instead, and record the drop.

7. `[[image slot="hero" kind="photo" brief="..."]]`
   Brief-writing instruction: one sentence naming a real place, team, or working session from the content brief, for example "The [Client] finance team at their [recorded location] office". If the content brief names none, write "Photo of the [Client] team or workplace". The brief text must not assert any fact the content brief does not contain. Always emit the slot; unfilled slots render as an upload space showing the brief.

8. `## ` Challenge section, 150 to 220 words.
   Heading is a declarative fragment built from the client's nouns naming the failure mode, never the literal words "The Challenge" (pattern: "Two customer counts, both defensible"). Body: the concrete broken state, who it hurt, what it cost, only brief facts. This is the only section where rhetorical questions are allowed.

9. `## ` Solution section, 250 to 350 words.
   Declarative heading naming what was built. Mechanism first: what Brutal built, walked in data-flow or dependency order; each component gets one plain sentence of what it does, one concrete brief-supplied example, and one consequence sentence. Name tools and file paths only if the brief supplies them.

10. `[[image slot="system" kind="screenshot" brief="..."]]`
    Placed inside the solution section after the component walkthrough. Brief-writing instruction: "Screenshot of [the named system, dashboard, or repository from the content brief], showing [the specific view the adjacent paragraphs describe]". If the brief names no system, the brief text reads "Screenshot of the system described above". Optionally follow with one italic caption line, only if every noun in it is brief-supplied; otherwise no caption.

11. `:::quote`
    One recorded quote, verbatim; line 2 is "Name, Role" exactly as recorded. Position: directly after the solution section. Degradation: no recorded quote in the brief, drop this block entirely and record the drop. Never substitute a paraphrase.

12. `## ` Results section, 150 to 250 words.
    Declarative heading that can carry a number (pattern: "Nine days of close became two"). Each result number appears with its source class, its confound, and an undersold causal verb. Restate, do not re-derive, the stat grid numbers; add secondary recorded numbers inline. Where a needed result is not recorded, write the [MISSING] marker, never an estimate.

13. Generalization paragraph, 80 to 120 words, no heading.
    Describes a hypothetical organization in an adjacent situation with generic artifact types (spreadsheets, PDFs, legacy databases are permitted as hypothetical furniture) and maps the built mechanism onto it. Banned inside: imperatives, "you should", any mention of Brutal or any vendor, any invented specific fact about a real company.

14. `:::about-client`
    2 to 3 sentences, brief facts only: what the company does, plus recorded scale facts if any.

15. `:::about-brutal`
    The fixed Brutal boilerplate sentence supplied with the brief. If absent, the block contains `[MISSING: About Brutal boilerplate]`.

## Budget

Total publishable body 700 to 1,100 words. A brief with a short engagement or no telemetry caps at 800 words; apply the stat grid degradation check before cutting anything else. Padding a thin brief to full length is banned; cut sections and record the cuts.

---

## Photo Story (photo-story)

When to use: Use when the brief carries named people and concrete workplace or artifact texture but fewer than two recorded outcome numbers.

# Template: Photo Story

A continuous editorial narrative with no section headings: a standfirst, a scene-setting cold open, people-forward photography alternating with text every two to four paragraphs, quotes punctuating the back half, and any result number delivered late, in the client's own recorded words where possible. Shape observed in the Airtable/Taylor Guitars pattern: one unbroken column of story, images as breathers, the ROI carried by a quote near the end.

## Global rules (apply to every section)

- Closed world. Every number, name, tool, system, quote, scene detail, and client noun comes from the content brief. A needed missing fact is written as an inline marker, for example [MISSING: hours saved per week]. Nothing is invented, rounded up, or inferred; no scene detail may be imagined for atmosphere.
- Radioactive examples. Every sample value, noun, and pattern name in this spec illustrates shape only; none of it may appear in the output unless the content brief independently supplies it.
- Every number carries its brief-assigned source class (internal telemetry, client-recorded, linked external research) the first time it appears. No class, no number.
- Every before/after claim states its confound in the same or next sentence and undersells the causal verb.
- Zero em dashes and zero double hyphens anywhere, including image briefs. Use a comma, colon, parentheses, or a new sentence.
- No marketing adjectives, no hype verbs, no unquantified outcome comparatives. Mechanism before benefit.
- The client is the protagonist; Brutal is the enabling partner. The texture must be the client's own nouns.
- Quotes are verbatim recorded quotes only, attribution exactly as recorded. No recorded quote means the block is dropped, never paraphrased.
- No CTA. No rhetorical questions anywhere in this template (it has no diagnosis section). Zero exclamation marks.
- This template never uses `:::stats`. All numbers live inline in prose, each with source class and confound.

## Output skeleton, in this exact order

1. PRODUCER NOTE (outside the publishable body): every dropped optional block and every [MISSING] marker. Emit even when empty.

2. `[[logo]]` Always emit.

3. H1: `How [Client] [concrete outcome] with Brutal`
   The outcome may be non-numeric when no number is recorded, but it must be concrete and mechanical ("replaced four request channels with one intake form"), never an unquantified comparative ("works faster") and never aspirational mission language.

4. Standfirst: one bold paragraph, 25 to 40 words, summarizing problem to outcome in plain declaratives. This is the only summary element; do not repeat it later.

5. Cold open, 60 to 90 words: a concrete recorded scene, workplace detail, or artifact from the brief, told in third person with the client's nouns. No invented dialogue, no invented physical detail. Degradation: if the brief contains no scene texture, open instead on the client's most concrete recorded artifact or workflow fact.

6. `[[image slot="scene" kind="photo" brief="..."]]`
   Brief-writing instruction: one sentence naming the recorded place, product, or workplace element the cold open describes. If none is recorded: "Photo of the [Client] workplace or product". The brief must not assert facts the content brief does not contain.

7. Client and people, 100 to 150 words: what the company does, recorded scale facts woven inline with source classes, and the protagonist(s) introduced by full name and role as recorded. Degradation: no named person in the brief, introduce the team by its recorded team name and record the drop of the protagonist device.

8. Problem, 140 to 200 words: the broken workflow in the client's nouns, who it hurt, what it cost. Only brief facts.

9. `[[image slot="people" kind="photo" brief="..."]]`
   Brief-writing instruction: portrait of the named protagonist ("Portrait of [Name], [Role] at [Client]") when the brief names one; otherwise "Photo of the [Client] team working together".

10. `:::quote` Quote 1: a recorded quote about the problem or the turning point; line 2 "Name, Role" as recorded. Degradation: not recorded, drop the block; the problem passage flows straight into the solution.

11. Solution passage one, 80 to 120 words: what Brutal built, mechanism first, with one concrete brief-supplied example.

12. `[[image slot="working" kind="screenshot" brief="..."]]`
    Kind selection: use kind="screenshot" and name the system view when the brief names a built system; otherwise switch the slot to kind="photo" with brief "Photo of the [Client] team using the new workflow". The brief text names only brief-supplied nouns.

13. Solution passage two, 80 to 120 words: the second mechanism layer or the rollout, with one concrete example.

14. `:::quote` Quote 2: prefer the recorded quote that carries a result number, placed here so the story's proof arrives in the client's voice. Degradation: no such quote, move the number (if recorded) into the results passage as prose with source class and confound; if a second recorded quote without a number exists, it may stand here instead; if none, drop the block.

15. Results and callback, 80 to 130 words: recorded result numbers inline, each with source class and confound and an undersold causal verb; unrecorded but needed numbers become [MISSING] markers. The final sentence echoes the H1 outcome in the client's nouns without repeating it verbatim.

16. Generalization paragraph, 60 to 100 words, no heading: a hypothetical organization with generic artifact types, the demonstrated mechanism mapped onto it. Banned inside: imperatives, "you should", any mention of Brutal or any vendor, any invented specific fact about a real company.

17. `:::sidebar`
    Industry plus any other supplied fields (Size, Engagement length, Systems), one "Field: value" line each. Drop unsupplied lines; drop the block below two lines and record it.

18. `:::about-client` 2 to 3 sentences, brief facts only.

19. `:::about-brutal` The fixed boilerplate sentence; if absent, `[MISSING: About Brutal boilerplate]`.

## Budget

Total publishable body 650 to 950 words. The narrative must never be padded to reach the range; a thin brief produces a shorter story and the producer note says so.

---

## Quote-Led (quote-led)

When to use: Use when the brief records at least two verbatim client quotes with name and role; degrade or switch templates below that.

# Template: Quote-Led

The client's recorded voice frames the page: a lead quote directly under the H1, a Challenge / Solution / Outcome triad up top, quote blocks as section breakers, and the story closing on the client's own words. Shape observed in the Contentful/Audible pattern (styled quote panels between sections, a compact Challenge/Solution/Outcome block with exactly two metrics) and the Figma close (the article's final text is the customer speaking).

## Global rules (apply to every section)

- Closed world. Every number, name, tool, quote, and client noun comes from the content brief. Needed missing facts become inline [MISSING: ...] markers, never inventions.
- Radioactive examples. Every sample value, noun, and pattern name in this spec illustrates shape only; none of it may appear in the output unless the content brief independently supplies it.
- Quotes are the load-bearing element and the strictest rule: verbatim recorded quotes only, attribution "Name, Role" exactly as recorded, no trimming that changes meaning, no reconstructed or paraphrased speech, ever. This template must degrade honestly rather than fake its shape (see the degradation ladder below).
- Every number carries its brief-assigned source class (internal telemetry, client-recorded, linked external research) the first time it appears. Every before/after claim states its confound and undersells the causal verb.
- Zero em dashes and zero double hyphens anywhere. No marketing adjectives, hype verbs, or unquantified outcome comparatives. Mechanism before benefit.
- The client is the protagonist; Brutal is the enabling partner; the texture is the client's own nouns.
- No CTA. Rhetorical questions only inside the challenge deep-dive section. Zero exclamation marks.

## The degradation ladder (defining rule of this template)

- 3 or more recorded quotes: fill all three quote positions (lead, mid, closing).
- Exactly 2: keep the lead and closing positions, drop the mid block.
- Exactly 1: keep only the lead quote; drop the other two blocks; record the degradation.
- 0: drop all quote blocks, promote the strongest recorded number into the position directly under the H1 as one plain declarative sentence, and the producer note must state "quote-led template ran without quotes; stat-led-hero recommended". If no recorded number exists either, emit nothing under the H1 and record that as well. Do not simulate the shape with invented or composite speech under any circumstances.

## Output skeleton, in this exact order

1. PRODUCER NOTE (outside the publishable body): dropped blocks, [MISSING] markers, and the degradation-ladder rung applied.

2. `[[logo]]` Always emit.

3. H1: `How [Client] [concrete outcome] with Brutal`
   Prefer a quantified outcome when one is recorded; otherwise a concrete countable mechanism outcome. Never unquantified comparatives, never hype.

4. `:::quote` Lead quote: the single strongest recorded quote, placed directly under the title so the client speaks first. Line 2 "Name, Role" as recorded. Degradation per the ladder; at rung 0, replace with one plain sentence carrying the strongest recorded number, its source class, and its confound.

5. `:::sidebar`
   "Field: value" lines for Industry, Size, Engagement length, Systems; only supplied fields; drop the block below two lines and record it.

6. Challenge / Solution / Outcome triad: three consecutive one-sentence paragraphs with bold lead-ins.
   `**Challenge:**` the broken state in one sentence, client nouns only. `**Solution:**` what was built, mechanism named, one sentence. `**Outcome:**` one sentence carrying the strongest recorded number with its source class; if no number is recorded, the concrete mechanism outcome plus, where needed, a [MISSING] marker.

7. `:::stats`
   Exactly 2 or 3 cards, one line each: `value | label | source class`, exact recorded values, dry lowercase labels. Degradation: fewer than 2 recorded numbers with source classes, drop the grid; the Outcome sentence already carries the single number.

8. `[[image slot="hero" kind="screenshot" brief="..."]]`
   Brief-writing instruction: "Screenshot of [the named built system from the content brief], showing [the view the triad's Solution sentence names]". If the brief names no system, switch the slot to kind="photo" with brief "Photo of the [Client] team or workplace". No brief-external facts in the brief text.

9. `## ` Challenge deep-dive, 150 to 200 words.
   Declarative heading from the client's nouns, never the word "Challenge" alone. The concrete broken state, its cost, only brief facts. Rhetorical questions allowed here only.

10. `## ` Solution section, 200 to 300 words.
    Declarative heading naming what was built. Mechanism first, components in data-flow order, one concrete brief-supplied example per component.

11. `[[image slot="detail" kind="screenshot" brief="..."]]`
    Inside the solution section. Brief-writing instruction: name the specific recorded artifact the adjacent paragraphs discuss (a pipeline, a dashboard, a repository); if none is named, "Screenshot of the system described above". kind="infographic" is permitted only if the brief supplies a diagrammable linear or hierarchical topology.

12. `:::quote` Mid quote: a recorded quote that comments on the solution or rollout. Position: between the solution and results sections. Degradation per the ladder.

13. `## ` Results section, 150 to 200 words.
    Declarative heading. Every recorded result number with source class, confound, and an undersold causal verb; needed unrecorded numbers as [MISSING] markers. Restate stat grid values rather than introducing arithmetic.

14. `:::quote` Closing quote: the story's final element before the generalization; the page closes on the client's recorded voice, preferring a forward-looking recorded quote. Degradation per the ladder; when dropped, the results section's final sentence closes the story.

15. Generalization paragraph, 80 to 120 words, no heading: hypothetical organization, generic artifact types, mechanism mapped across. Banned inside: imperatives, "you should", any mention of Brutal or any vendor, any invented specific fact about a real company.

16. `:::about-client` 2 to 3 sentences, brief facts only.

17. `:::about-brutal` Fixed boilerplate sentence; if absent, `[MISSING: About Brutal boilerplate]`.

## Budget

Total publishable body 700 to 1,000 words, excluding quote blocks. Quotes never substitute for the mechanism walkthrough; the solution section must stand if every quote were removed.

---

## One-Pager (one-pager)

When to use: Use when the engagement was short or the brief has no telemetry, or when a compact page under 700 words is requested.

# Template: One-Pager

A short, dense page with no stat grid and no dek element: the opening paragraphs do the dek's work with numbers woven inline, one bold-led "Why [Client] chose Brutal" list, one captioned screenshot of a real artifact, results as a bold-number bullet list, an optional closing quote. Shape observed in the Figma/EndeavourX pattern: all numbers typographically modest and inline, emphasis by bolding inside lists, evidence-style screenshots with one-sentence captions, and the article closing on the customer's voice when a quote exists.

## Global rules (apply to every section)

- Closed world. Every number, name, tool, quote, artifact, and client noun comes from the content brief. Needed missing facts become inline [MISSING: ...] markers; nothing is invented, rounded up, or inferred.
- Radioactive examples. Every sample value, noun, number, and pattern name in this spec (including the sample results bullet) illustrates shape only; none of it may appear in the output unless the content brief independently supplies it.
- Every number carries its brief-assigned source class (internal telemetry, client-recorded, linked external research) the first time it appears. Every before/after claim states its confound and undersells the causal verb.
- Zero em dashes and zero double hyphens anywhere, including captions, briefs, and bullet lists.
- No marketing adjectives, no hype verbs, no unquantified outcome comparatives. Mechanism before benefit.
- The client is the protagonist; Brutal is the enabling partner; the texture is the client's own nouns.
- Quotes are verbatim recorded quotes only, attribution exactly as recorded; no recorded quote means the block is dropped, never faked.
- This template never uses `:::stats`; it persuades with inline numbers. It never exceeds 700 words of publishable body; a thin brief produces a shorter page, not a padded one.
- No CTA. No rhetorical questions (this template has no diagnosis section). Zero exclamation marks.

## Output skeleton, in this exact order

1. PRODUCER NOTE (outside the publishable body): every dropped optional element and every [MISSING] marker. Emit even when empty.

2. `[[logo]]` Always emit.

3. H1: `How [Client] [concrete outcome] with Brutal`
   Quantified when a recorded number allows it; otherwise a concrete countable mechanism outcome. No unquantified comparatives, no hype phrases.

4. Intro, 3 or 4 short paragraphs totaling 90 to 130 words, no separate dek. Paragraph one: who the client is and the concrete pain, in their nouns. Recorded scale facts woven inline with source classes. The final intro paragraph states the headline result in prose with its confound in the same sentence. Single-sentence paragraphs are acceptable here.

5. `:::sidebar`
   Compact facts: Industry, Size, Engagement length, Systems, one "Field: value" line each, only supplied fields. Degradation: below two supplied fields, drop the block and record it.

6. `## ` Context and decision section, 100 to 140 words.
   Short declarative heading in the client's nouns. Ends with a bold-led bullet list introduced by the plain line "Why [Client] chose Brutal:" containing 3 or 4 bullets, each a bolded noun phrase followed by one plain sentence, drawn only from recorded decision reasons in the brief. Degradation: fewer than 3 recorded reasons, drop the list, keep the reasons as prose, and record the drop.

7. `[[image slot="artifact" kind="screenshot" brief="..."]]`
   Brief-writing instruction: one sentence naming a real recorded artifact and what it shows, for example "Screenshot of [Client]'s [named dashboard or repository from the brief], showing [the recorded view]". If the brief names no on-screen artifact, switch to kind="photo" with brief "Photo of the [Client] team or workplace". Directly below the slot, one italic caption line naming the artifact and why it matters, built only from brief nouns; if that cannot be done, omit the caption and record the omission.

8. `## ` What was built section, 120 to 180 words.
   Declarative heading. Mechanism first: components in data-flow order, one concrete brief-supplied example of the system in use, tools and paths only if recorded.

9. `## ` Results section, 90 to 140 words.
   Declarative heading that can carry a number. Results as a plain bullet list, each bullet with the number phrase bolded and the context in regular weight (pattern: "**35 to 93** merged PRs per month, internal telemetry, same team size across the window"). Each bullet carries source class and confound. Degradation: fewer than 2 recorded result numbers, no bullet list; the single number (or its [MISSING] marker) stays in one prose sentence with source class and confound.

10. `:::quote`
    Closing quote, verbatim, line 2 "Name, Role" as recorded, placed so the story ends in the client's voice. Degradation: no recorded quote, drop the block; the results section's final sentence closes the story. Never paraphrase.

11. Generalization paragraph, 50 to 80 words, no heading: a hypothetical organization with generic artifact types (spreadsheets, PDFs, legacy databases) and the mechanism mapped onto it. Banned inside: imperatives, "you should", any mention of Brutal or any vendor, any invented specific fact about a real company.

12. `:::about-client` 2 to 3 sentences, brief facts only.

13. `:::about-brutal` Fixed boilerplate sentence; if absent, `[MISSING: About Brutal boilerplate]`.

## Budget

Total publishable body 450 to 700 words. Sections average under 150 words; two to five short paragraphs each. When the brief cannot fill a section with recorded facts, the section is cut, the page shortens, and the producer note records the cut.