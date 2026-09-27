# `economic-rent` — finish brief (passes 2–4)

Row 2 of the CORE spine; the earliest unfinished article, and the one
blocking the spine. Its pass 1 is done and recorded in the repo; this brief
covers only what remains. Planned 16 Sep 2026.

## What exists (`articles/economic-rent/`)

- `src/technology.js` — the subject module, complete: `dominates` /
  `undominated` (the rectangle test), `winInterval` (algebraic price
  interval), `lowerHull` (geometric), `cheapest`/`envelope`/`gap`/`rent`/
  `rentSlope`. **Two constructions sharing no algebra — `winInterval` vs
  `lowerHull` — and the claim is that they return the same technologies.**
  That is the two-routes pattern; assert it in `check-numbers.mjs`.
- `src/datasets.js` — the seven technologies, the price regimes, the
  BALANCED trap and its window (`BAL_MIN/BAL_MAX/BAL_CHORD/BAL_EVICTS`),
  with the reasoning in comments. Read it before writing a word.
- `src/precomputed.js` and `scripts/precompute.mjs` — the precomputed sweep.
- Plumbing only otherwise: `Logo.svelte`, `Scrolly.svelte`, the usual
  `chart.js`/`palette.js`/`rng.js`/`katexify.js`, plus
  `verify/check-browser.mjs` and `verify/ship.sh`.

## What does not exist

`App.svelte`, `Meta.svelte`, `Title.svelte`, every content component, the
`README.md` with the claim table, and `verify/check-numbers.mjs`. The copied
`check-browser.mjs` still carries the scaffold's own checks and will fail on
`.sticky`/`.steps` until its article half is rewritten
(`reference/scaffolding.md`).

## The recorded design (from `subject-queue.md` row 2 and the datasets)

- Claim: **rent is the reward for being temporarily different, and
  competition is what destroys it and what spreads the innovation.**
- Shape: **question first**, hook **`RentLab`**; the reader-runnable
  procedure is the rectangle test (`dominates`), and the trap is `BALANCED` —
  beaten by nothing, chosen never, until the relative price moves.
- The identity on screen (the pass-1 record): the **point–line duality** —
  each technology is a point in input space and a line in (r, cost) space,
  and the lower envelope's slope *is* the input demand.

## Order of work

1. Read `src/datasets.js` and `src/technology.js` end to end; re-derive the
   claim verdicts (the rectangle-test results, the BALANCED window bounds,
   the switch prices 1, 3, 8) — they are asserted in comments, so prove them.
2. Components, `App.svelte`, `Meta.svelte`, `Title.svelte` per the recorded
   shape; prose per `reference/writing-the-prose.md`, written from the
   measurement.
3. `verify/check-numbers.mjs` from scratch: the two-routes assertion, the
   BALANCED window bounds as `===` where exact, the switch prices.
4. Rewrite the article half of `check-browser.mjs`; `./verify/ship.sh` green;
   browser checks at 390px and 1280px.
5. Pass 4: README, shape-table row, queue tick, `site/articles.json` entry
   (blurb = the claim), reference updates.

## Risks

- The original pass-1 spec lives in the project docs, not the repo — if any
  recorded claim above disagrees with what the modules measure, the modules
  win and this brief gets corrected in the same session.
- BALANCED's window closes at R = 14 (`BAL_EVICTS`) and the closed form
  changes — assert both regimes separately, or the check proves the wrong
  formula.