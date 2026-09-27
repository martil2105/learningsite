# The next three economics articles — pass-1 brief

> **Superseded on voice.** These specs were written before the voice rules of
> 22 September 2026. Where anything here disagrees with
> `reference/writing-the-prose.md`, that file wins. In particular, "report the
> draw count in the prose" means a sample the reader is looking at, never the
> checks' own counts or tolerances, and "the textbook" framings are pitches for
> the builder, not sentences for the page.

Planned 17 September 2026. One spec per article in this directory, plus the
plan-time probe scripts under `probes/`. Hand each spec to the implementer
with `CLAUDE.md`, `reference/pass-1-design.md`,
`reference/choosing-the-shape.md`, `reference/scaffolding.md`,
`reference/house-idioms.md`, `reference/writing-the-prose.md` and
`reference/verifying-an-article.md` in context.

These are rows 3, 4 and 5 of `economics-curriculum-slate.md` — the Stage 1
micro backbone. They are **backfill**: rows 6, 7, 8 and 9 shipped ahead of
them out of the `economics-next-five` brief, so three already-published
articles sit downstream of three unbuilt prerequisites. That is the one thing
about this brief that is not like the last one, and it is what §"Non-overlap"
in each spec exists for.

**Status of the numbers in the specs.** Every verdict was measured in
throwaway node probes on 17 September 2026 — closed forms against independent
numerical routes, and each invariance through an oracle that could have seen
the variable it is claimed not to depend on. They are hypotheses, not
findings: the first job of every pass 1 is to re-derive them against the
article's own `src/` modules. Where a new measurement disagrees, the
measurement wins and the spec changes (`verifying-an-article.md` has three
precedents, and `economics-next-five` produced two more).

The probes are kept in `probes/` so the measurements can be reproduced rather
than taken on trust. **They are not a module to import.** They use their own
generators and their own algebra on purpose, which is what makes them an
independent route; copying one into `src/` would turn two derivations into
one.

## Build order

| # | Slug | Row | Why here |
|---|---|---|---|
| 1 | `supply-and-demand` | Mi3, row 3 | builds `MarketPanel`, the shared two-curve panel the slate has owed since row 3; nothing else needs building first |
| 2 | `elasticity` | Mi4, row 4 | lifts `markup-and-elasticity`'s pinned demand family; the ruler is a figure, not a market |
| 3 | `surplus-and-efficiency` | Mi5, row 5 | lifts `MarketPanel` from article 1 and `market.js` from `tax-incidence`; its second half needs the value distribution article 1 draws |

This is the slate's own order and there is no reason to depart from it. The
dependency that matters is `MarketPanel`: article 1 builds it, article 3
reuses it, and article 2 does not need it.

## The reading-order problem, and what each spec owes because of it

`tax-incidence` (row 6) needs Mi4 and Mi5. `markup-and-elasticity` (row 9 in
the CORE queue, row 9 of the slate's Stage 1 micro) needs Mi4 and Mi7.
`externalities` (row 8) needs Mi5. All three are live. So:

1. **Every spec has a `Non-overlap` section naming what the downstream
   article already proved.** Do not re-prove it, do not re-parameterise it,
   and do not gesture at it as though it were new. Link to it.
2. **Write each article for a reader who has not read the downstream one.**
   A backfilled prerequisite that assumes its own successor is unreadable in
   the slate's order, which is the order the spine page presents.
3. **The spine page needs its bridges rewritten in pass 4, not appended to.**
   `scripts/render-index.py` and `site/articles.json` order by the slate, so
   inserting rows 3, 4 and 5 changes the two-sentence bridge on both sides of
   each insertion — six bridges, not three. Budget for it, and check the
   rendered index rather than the manifest.
4. **Update the slate's own notes.** `economics-curriculum-slate.md` says the
   supply–demand panel is "first needed at Mi3; reused by Mi5, Mi6, Mi8 and
   Ma10", and Mi6 and Mi8 have already built their own wedge module instead.
   Correct that line in pass 4 of article 1 rather than leaving it to read as
   a plan.

## Cross-cutting rules (put these in every handoff)

1. **Re-derive before you build.** See the status note above.
2. **An invariance claim needs an oracle that could have seen the variable.**
   This bites hardest in article 1: the claim "with only demand shifting,
   every observation lies on the supply curve" is true *by construction* if
   the equilibrium is computed from the supply equation. The plan-time probe
   was rewritten to clear the market by bisecting excess demand — which reads
   both curves and both shocks — and it puts the same points more than 40 units away
   from the demand curve, so it could have failed. Keep that solver.
3. **Two derivations sharing no code** for every headline number: one closed
   form, one solver, integrator or simulation.
4. **`===` where the arithmetic is exact**, a stated tolerance elsewhere, and
   each tolerance says which of the two it is. Three tolerances recur here and
   each has a known cause:
   - *machine precision* (identities): < 1e-12, usually ~1e-15;
   - *the flat-maximum floor* (~1e-7 to 1e-8): golden-section search near a
     quadratic maximum cannot do better than √ε. `constrained-choice`
     documented it and `efficiency-wages` re-measured it. Assert within it and
     never call it exact;
   - *sampling* (Monte Carlo): report the number of draws in the prose and
     assert the rounding, not the decimal the seed chose
     (`verifying-an-article.md`, the `comparative-advantage` precedent).
5. **Spell reciprocal sums as a single division.** `1/B + 1/S` is one bit
   short of `(B+S)/(B*S)` in doubles — `1/3 + 1/2 === 5/6` is false — and a
   check written as `k === 5/6` therefore fails on a correct module. Article 3
   depends on this constant; found at plan time, and it belongs in
   `house-idioms.md` once an article has hit it.
6. **Shared modules, in this order.**
   - Article 1 builds `src/market.js` by **copying `tax-incidence`'s** and
     adding the shock/shift machinery and the moment algebra. Keep `A, B, C,
     S`, `p0`, `q0` and the base market `A=120, B=3, C=20, S=2` identical, so
     `p0 = 20` and `q0 = 60` mean the same thing in every economics article.
   - Article 1 also builds `src/Components/MarketPanel.svelte`: the two
     curves, the crossing, optional surplus shading, on a domain fixed once
     for the whole article (the fixed-scale rule in `house-idioms.md`).
     Article 3 imports it unchanged and switches the shading on.
   - Article 2 copies `markup-and-elasticity`'s `src/demand.js` for the pinned
     family and adds the ruler, the arc and log formulas, and the revenue
     helpers. It does **not** take `optimalPrice`, `numericOptimal`,
     `passThrough` or `numericPassThrough` — those are the downstream
     article's subject.
   - Article 3 copies article 1's `market.js` and adds the surplus integrals
     and the rationing model.
   Copy plumbing, never shape (`scaffolding.md`).
7. **Prose per `reference/writing-the-prose.md`** — "we" to narrate, "you" to
   instruct, whole sentences with the logic said out loud, at most one dash
   pair per paragraph, bold-then-define in the same sentence, British
   spelling, `Thanks for reading!` as its own paragraph. Labels stay terse.
8. **One hook, small interactions everywhere else**, and every one of them
   gets a browser check.
9. **Verify every citation before writing the sentence that leans on it.**
   The names, years and volume numbers in the specs are from memory. Two
   specifics were cut from `smote` for exactly this reason.
10. **Per-article budget**: 15–22 `ok()` blocks in `check-numbers.mjs` (the
   shipped economics articles run 13–17, and each of these has one more
   identity than they did), 50–150 assertions in `check-browser.mjs` at 390px
   and 1280px, including at least one rendered-pixel geometry assertion via
   `getScreenCTM()`. Article 2's ruler is the strongest geometry check the
   project has had available — do not settle for a bounding-box test on it.
11. **Three categorical colours, hard ceiling** (`house-idioms.md`). Article 1
    wants four things distinguished (demand, supply, the cloud, the fitted
    line); the cloud is `#8a94a2`, the background class, which is not a hue
    and does not spend a slot.

## Headline identities (details and exact numbers in each spec)

| Article | The identity | Measured at plan time |
|---|---|---|
| `supply-and-demand` | the data pins the demand slope only to a bracket, and the bracket's width ratio is **exactly 1/R²** — the goodness-of-fit statistic is the identification failure, read backwards | 4.81e-16 worst relative gap over the 199,843 downward-sloping draws in 400,000 random markets; the truth inside the bracket 199,843 times out of 199,843 |
| `elasticity` | \|ε\| is the **ratio of the two pieces the point cuts its own tangent into** — on every demand curve, not only straight ones | 4.5e-15 worst over five curve families × 3,000 points each |
| `surplus-and-efficiency` | with the price held down and the goods rationed at random, **the share of the gains from trade lost equals the quantity cut itself**, exactly and linearly — while the triangle alone is its square | 8.88e-16 worst over the 369,402 admissible draws in 400,000 random markets |

All three are wide-range identities of the kind `pass-1-design.md` says to
budget probe time for, and none of the three was in the slate's "what it
shows" line. Rows 3, 4 and 5 of the slate should be rewritten to the claims
above in pass 4 — the slate's own instruction.

## Also owed

- **Six spine bridges**, per §"The reading-order problem" above.
- **Pass-4 bookkeeping, every article**: a shape-table row
  (`choosing-the-shape.md`), a queue tick (`subject-queue.md`), a slate status
  change and a corrected "what it shows" line
  (`economics-curriculum-slate.md`), a `site/articles.json` entry whose blurb
  is the claim, and anything learned that is not about the subject folded back
  into `reference/`.
- **One reference-file debt is already visible.** Nothing in `reference/`
  currently says how to write a check for a claim about a *population moment*
  estimated from a simulation — the distinction between an identity in the
  moments (machine precision) and the same identity in a sample (sampling
  error, and the draw count belongs in the prose). Article 1 will need the
  rule; write it into `verifying-an-article.md` in its pass 4.

## Environment reminders

The standing ones all apply (`house-idioms.md`, § Environment): `emptyOutDir`
stays false, GNU sed, always `<<'EOF'`, `sync; sleep 1` between a build and
anything that reads its output, `NODE_PATH` for the Linux rolldown bindings
when `node_modules` was installed on the Mac, read-only git in `site/` as
`git --no-optional-locks`, and `device_bash` cannot delete — scaffold by
selective copy.
