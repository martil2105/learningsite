# Interactive explainer generator

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
  numbers, and produce a verified tarball for the browser checks.
  `-m 'a string I just added'` proves your edit reached the bundle.

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
3. **Verify.** `./verify/ship.sh`, then the browser checks, then fix what they
   find. Mostly mechanical — Sonnet or Haiku.
4. **Review.** Read the prose against the charts, run the final read-through in
   `reference/verifying-an-article.md`, fix the claims. Then close the loop:
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
- **Nothing ships unverified.** Both check files pass, and somebody has looked at
  the screenshots.

## Editorial voice

Short visual essays, not textbook chapters.

- Second person, conversational. "Drag the point below…"
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
