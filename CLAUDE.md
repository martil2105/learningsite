# Interactive explainer generator

**Where it lives:** `/Users/martin/Documents/GitHub/learningsite` on Martin's
Mac, and this is the only folder we work in. It is one git repository,
github.com/martil2105/learningsite: the generator (`articles/`, `reference/`,
`scripts/`) and the built site (`site/`, published to GitHub Pages by
`.github/workflows/pages.yml`) together. Moved here on 27 September 2026 from
`~/Documents/GitHub/mlu-explain-generator`, which no longer exists. In the
Linux VM behind `device_bash` the folder is mounted at
`/sessions/<session>/mnt/learningsite`.

Given a subject, build a short interactive visual essay about it. The subject can
arrive as a topic ("SMOTE"), as a paper, or as a chapter of a book you have been
handed. The style reference is Amazon's MLU-Explain
(https://mlu-explain.github.io/), whose repo is cloned at
`reference/aws-mlu-explain/` as a pattern reference and a scaffold source — never
as a source of prose.

**The style is the constant; the subject is not.** Machine learning, statistics,
econometrics, economic models and results lifted from papers all share one stack,
one voice and one standard of verification. What differs between them is how
pass 1 finds the claim, and that is one file.

## Load these when you need them

This file is in context for every session, so it stays short. Most sessions are
verification, review or a single fix, and should not be paying for the scaffold
recipe. The detail lives in files you read at the point you need them:

| Read | When |
|---|---|
| `reference/pass-1-design.md` | pass 1, every article — the kinds of subject, and how to find the claim |
| `reference/subject-queue.md` | pass 1, before picking a subject — what is worth an article, and what is queued |
| `reference/choosing-the-shape.md` | pass 1, before there is an outline — the shape menu, and what has been built |
| `reference/scaffolding.md` | pass 2, before creating the article directory |
| `reference/house-idioms.md` | before writing or editing any component or chart |
| `reference/writing-the-prose.md` | **pass 2 and pass 4, every article**, and before rewording any prose — the house voice, the two ways it drifts, and what a rewrite must not change |
| `reference/verifying-an-article.md` | before writing the checks, and before calling an article done |
| `reference/publishing.md` | when an article goes live |
| `reference/hybrid-workflow.md` | only when asked for the cheap or hybrid workflow — delegating bulk passes to a cheaper model |

Each is a list of rules that were real bugs in articles that looked finished.
Read the relevant one rather than opening a 15KB component to relearn a
convention.

## What exists

`site/articles.json` is the manifest and the only source of truth for what is
published: an article is live if and only if it has an entry there. The table in
`reference/choosing-the-shape.md` records each article's kind, shape and hook —
read it in pass 1 so the new one is not the eleventh of the same thing, and add a
row to it in pass 4.

## What to build about

The current line is **economics** — the models a quantitative practitioner is
expected to have met and usually met once, at speed, in a diagram — then
econometric estimators with a load-bearing identifying assumption, concepts with
a regime where the intuition inverts, and single results taken from papers. ML
methods are not retired; ten are shipped, and the eleventh adds less than the
first article in a field that has none.

**Finance** is a second line, since 26 September 2026: the technical side of
markets, in the order of the project doc `claude/finance-curriculum-slate.md`.
Its articles are ordinary articles on this stack with `track: "finance"` in the
manifest. Its Stage 8 includes **paper explainers** (📄), one paper per article,
with a citation card under the title; the shape is in
`reference/choosing-the-shape.md`.

The test at the start is always the same: a practitioner carries a compressed
explanation of this subject, and the compression is lossy somewhere you can put
on screen. `reference/subject-queue.md` has the queue and the reasoning.

## Notes and articles

**Notes are cheap, and there should be many.** `/read-source` takes a paper, a
chapter or a set of lecture notes and writes a study note to the project: what it
claims, which step is load-bearing, what it is cited for versus what it shows,
one number reproduced independently, and the candidate article angles. Most
sources should stop here. Reading something carefully is worth doing on its own,
and it costs one session rather than four.

**Articles are expensive, and there should be few.** A note graduates when it has
a claim that can be **proved on screen** — something a reader can watch happen,
that a check can assert, and that the received account of the subject gets
slightly wrong. No such claim, no article: a chapter summary with sliders on it
is not one of these.

## Stack

**New articles: Svelte 5 with runes, Vite 8, one self-contained npm project per
article.** `articles/_scaffold-svelte5/` is that plumbing, and it is proved
rather than asserted — `./verify/ship.sh` green, and 28 browser checks passing at
390px and 1280px including a rendered-pixel geometry assertion. What ships in a
bundle is `katex` and nothing else: the drawing helpers in `src/chart.js` are
dependency-free, and LayerCake, `svelte-drag`, `d3-selection` and the old
polyfill set are long gone. A build takes about 0.3s.

**The articles built on Svelte 3 + Rollup 2 stay there.** Their output is
already built and deployed, nothing is shared between articles at build or run
time, and there is no gain in moving them. `reference/house-idioms.md` carries
both sets of reactivity rules and says which applies where; the table in
`reference/choosing-the-shape.md` says which article is on which stack, so no
count lives in this file to go stale.

The reason for the change was one bug class rather than novelty: under Svelte 3 a
`const` or `function` helper reading a `$:` variable was invisible to dirty
tracking and drew half a chart at the initial width and half at the measured one,
with no error anywhere. Runes track the read, so the workaround is gone and must
not be ported forward.

## Commands

Inside an article directory:

- `npm install` — once
- `npm run dev` — the preview loop, http://localhost:5000, livereload
- `npm run build` — production build into `public/build/`
- `npm run precompute` — regenerates `src/precomputed.js` (only if the article has one)
- `npm run check` — `verify/check-numbers.mjs`
- `./verify/ship.sh` — build, refuse warnings, prove the build ran, run the
  numbers, run the prose gate, and produce a verified tarball for the browser
  checks. `-m 'a string I just added'` proves your edit reached the bundle.
- `node ../../scripts/check-prose.mjs . --report` — the prose gate on its own,
  with the voice numbers ("we", "you", contractions, "exactly" and dashes per
  1,000 words, and mean sentence length), to read against the targets in
  `reference/writing-the-prose.md`

From the repository root:

- `./scripts/build-site.sh` — refuse any published article that fails the prose
  gate, build every published article into `site/`, then load every page in a
  browser and refuse a page that errors or renders blank
- `node scripts/smoke-site.mjs <slug>` — that last step on its own

## Build a new article in four passes

Long single sessions are the main cost driver — the whole conversation is re-sent
with every tool call. Clear between passes and write the handoff down.

1. **Design.** Read `reference/pass-1-design.md` and
   `reference/choosing-the-shape.md`. Name the kind, the shape and the angle
   (narrow and deep beats survey), write the received account down as flat
   claims, and probe those claims in node before any component exists. The gap is
   the article. Record the claims and the verdicts in the article's `README.md`,
   assert each verdict in `verify/check-numbers.mjs`, and write a one-page spec to
   the project. Needs the strongest model.
2. **Build.** Scaffold per `reference/scaffolding.md`, then write every component
   from that spec with `reference/house-idioms.md` open. Sonnet handles this well.
   Prose written here is a draft, but it is written to
   `reference/writing-the-prose.md` from the first sentence, and **never lifted
   from the spec**: the spec's angle is a pitch written for the builder, and
   pasting it in is how three articles shipped in an op-ed voice.
3. **Verify.** `./verify/ship.sh`, then the browser checks, then fix what they
   find. Mostly mechanical — Sonnet or Haiku. The browser checks must be this
   article's own: a copied scaffold `check-browser.mjs` crashes on its first
   selector, and a check file that throws has checked nothing.
4. **Review.** Read the prose against the charts, run the final read-through in
   `reference/verifying-an-article.md`, fix the claims. Then the **voice pass**:
   read the rendered page top to bottom, as a reader, against
   `reference/writing-the-prose.md`, and rewrite whatever doesn't sound like a
   patient guide talking. The prose gate passing is necessary, not sufficient.
   Then close the loop:
   **anything you learned that is not about this subject goes into `reference/`** —
   house-idioms for a component rule, verifying-an-article for a checking rule —
   and the article gets its row in the shape table and its entry in
   `site/articles.json`. Per-article build notes accumulate nothing on their own;
   the reference files are the accumulator, and they are only ever as good as this
   step. Needs the strongest model; it is where the judgement is.

## Non-negotiables

- **Write every word from scratch.** True of the reference repo, and truer of
  source material: a paper or a chapter you have been handed is a source of
  *claims to test*, never of sentences, figures, worked examples or exercise
  data. Standard notation is standard; everything else you write yourself.
- **Source material never ships.** Papers and chapters live in `sources/` and
  stay out of `site/`. Name the work in the references, and cite the theorem or
  equation number you are discussing rather than gesturing at the paper.
- **Every number in the prose is derived by a check** — from the article's own
  modules, or from a data file pinned with its origin. A figure typed into a
  sentence by hand is a figure nobody will re-derive.
- **No Amazon Ember.** `public/assets/mlu-fonts/` is licensed for local viewing
  only — the header in `font.css` says so. The articles ship self-hosted Inter
  and IBM Plex Mono. `build-site.sh` and `ship.sh` both refuse an article that
  still has it.
- **No MLU-Explain branding in the page furniture.** Their robot and wordmark in
  the masthead make the page read as an MLU-Explain publication. Use the site
  mark in `Logo.svelte`, which the scaffold copies from the pinned article.
  Attribution belongs in the conclusion and the references, which is what
  CC BY-SA actually asks for.
- **Nothing ships unverified.** Both check files pass, somebody has looked at
  the screenshots, and `build-site.sh` has loaded the published page without an
  error. Two articles once went live as blank pages.
- **The prose sounds like MLU-Explain, in our own words.** Natural, smooth,
  a patient guide working through the idea with the reader. This is held to the
  same standard as the numbers: `ship.sh` fails on the prose gate
  (`scripts/check-prose.mjs`) exactly as it fails on a wrong number,
  `build-site.sh` refuses to publish an article that fails it, and pass 4 does
  not end until the rendered page has been read end to end for voice. An
  accurate article in the wrong voice is not finished. `/new-article` and
  `/finish-article` say the same, and neither the gate nor the voice pass is
  optional.

## Editorial voice

Short visual essays, not textbook chapters.

- **Standard length, since 10 October 2026: about 2,000 to 2,200 words** of body
  prose by the prose gate's count, with four or five figures and a guess card.
  Martin set this from rows 24 to 28 of the finance slate, which were built a
  third longer than the 1,500-word articles before them. The extra length goes
  into one more worked section with its own small figure, not into longer
  paragraphs. A shorter article is fine when the subject is genuinely small,
  but say so in the handoff rather than stopping early.

- **Narrate as "we", instruct as "you".** "Let's say we run a factory…", "our
  market", then "Drag the slider…". The register is MLU-Explain's, a patient
  guide working through the idea with the reader; the wording is always ours.
  MLU uses "we" about 36 times per 1,000 words: aim for 18 or more, and the gate
  fails under 12. The tone is calm and friendly, with room for a light moment,
  and no jokes, aphorisms or asides for their own sake.
- **Short sentences.** Aim for 16–20 words on average, as MLU does, and split
  anything over 35. Say the *so* or *because*, then end the sentence.
- **Whole sentences with the logic said out loud.** No fragments standing in for
  sentences, no run of short declaratives with the *so* and *because* left for
  the reader to supply, at most one dash pair in a paragraph, contractions
  welcome. Name a term in bold and define it in the same sentence, and close the
  conclusion with "Thanks for reading!". Button labels, readouts and legends
  stay terse. The rules, the traps and before/after pairs are in
  `reference/writing-the-prose.md`; the prose that prompted them is kept in
  `archive/prose-before-2026-09-15/`.
- **Captions say what to look at; the prose explains.** A caption doesn't
  repeat the numbers of the paragraph beside it, and a conclusion doesn't recap
  them all again.
- **The checks don't talk to the reader.** No sample sizes of checks, tolerances,
  pixel measurements, file names or notes to ourselves on the page. "Every
  number on this page is ours" is the whole of what the sources say about it.
- **Fair, not sweeping.** No "every textbook", no "that framing is fundamentally
  misleading", no grand adjectives. Say what first courses teach at the strength
  they teach it, then show what the article adds.
- **The page furniture is `comparative-advantage`'s.** The `#intro` title block,
  sentence-case `h3.body-header` section headings, figure titles in sentence case,
  captions that are sentences rather than "Figure 3." exhibits, a conclusion in
  paragraphs ending "Thanks for reading!", and sources that say what is ours and
  carry the CC BY-SA line. No kicker above the title, no all-caps slogan headings,
  no bullet-list conclusion.
- **One primary hook, and small interactions everywhere else.** The primary hook
  is a single manipulable object carrying the central claim, and it stays simple:
  if it needs ten controls, split it and hang the secondary parameters on a figure
  attached to the prose that explains them. That was the XGBoost article's real
  problem.
- But one interactive is a **floor, not a ceiling**, and reading it as a ceiling
  is what produces an article with a lab at the top and nothing to touch for the
  next four screens. Anywhere a sentence would be better as a control, make it
  one: a toggle inside a paragraph, a scrubber on a figure, a preset button that
  jumps a chart to the case the paragraph is describing. A reader who stops
  touching things has usually stopped reading.
- Small interactions are held to the same standard as the hook — reactive
  helpers, a clamped measured width, a `viewBox`, and something in
  `check-browser.mjs` that exercises them. An interaction nothing checks will
  quietly break.
- Every article has to do five things: motivate the problem, show the mechanism,
  let the reader work it, give the maths, and say what it costs you. Their *order*
  comes from the shape you chose, not from this list. Written in the order above
  they read as the default shape, which is the point of choosing one.
- The chart carries the explanation; the prose says what to look at.
- Be fair to whatever the article argues against, and give it its best case.
