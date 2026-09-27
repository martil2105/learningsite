# The next six economics articles — pass-1 brief

> **Superseded on voice.** These specs were written before the voice rules of
> 22 September 2026. Where anything here disagrees with
> `reference/writing-the-prose.md`, that file wins. In particular, "report the
> draw count in the prose" means a sample the reader is looking at, never the
> checks' own counts or tolerances, and "the textbook" framings are pitches for
> the builder, not sentences for the page.

Planned 17 September 2026. One spec per article in this directory, plus
`probes/plan-probes.mjs`, which reproduces and asserts every measured number
in them. Hand each spec to the implementer with `CLAUDE.md`,
`reference/pass-1-design.md`, `reference/choosing-the-shape.md`,
`reference/scaffolding.md`, `reference/house-idioms.md`,
`reference/writing-the-prose.md` and `reference/verifying-an-article.md` in
context.

These are slate rows 7, 8, 10, 11, 12 and 13 — **everything left in Stage 1
Microeconomics.** Rows 1, 2, 6 and 9 are live; rows 3, 4 and 5 are specced in
`reference/economics-next-three/`. When these six ship, the slate's first
stage is closed and the next brief is Stage 1 macro, which has nothing built
and no shared machinery yet.

**Status of the numbers in the specs.** Every verdict was measured in
throwaway node probes on 17 September 2026 — closed forms against independent
solvers, integrators or simulations, with each invariance run through an
oracle that could have seen the variable. They are hypotheses, not findings:
the first job of every pass 1 is to re-derive them against the article's own
`src/` modules. Where a new measurement disagrees, the measurement wins and
the spec changes.

The probes are in `probes/` so the measurements can be reproduced rather than
trusted. **They are not a module to import.** Their solvers and generators are
deliberately their own — that is what makes them an independent route, and
copying one into `src/` turns two derivations into one.

## Build order

Slate order, which is also module order. No swaps this time.

| # | Slug | Row | Builds | Needs |
|---|---|---|---|---|
| 1 | `cost-curves` | Mi7, row 7 | `src/cost.js` | `MarketPanel` from `supply-and-demand` |
| 2 | `perfect-competition` | Mi8, row 8 | `src/entry.js` | `cost.js`, `MarketPanel` |
| 3 | `monopolistic-competition` | Mi10, row 10 | `src/ces.js` | `entry.js` |
| 4 | `cartels-and-the-prisoners-dilemma` | Mi11, row 11 | `src/cournot.js`, `src/nplayer.js` | — |
| 5 | `tragedy-of-the-commons` | Mi12, row 12 | — | `nplayer.js` |
| 6 | `gini-and-the-lorenz-curve` | Mi13, row 13 | `src/inequality.js` | `stats.js` (from `population-stability-index`) |

Articles 4–6 are independent of 1–3 and can be built in parallel with them if
that is ever useful. Articles 1→2→3 are a chain and 4→5 is a chain.

**`economics-next-three` must ship first**, or at least `supply-and-demand`
must, because articles 1 and 2 draw the market on `MarketPanel`. If that slips,
build articles 4, 5 and 6 first — none of them touches it.

## What is different about this batch

1. **Three of the six invert their received account rather than qualifying
   it.** `cost-curves` finds that the textbook picture of the envelope is
   wrong everywhere except one point; `cartels` finds that a cartel is usually
   not profitable at all, never mind unstable; `monopolistic-competition`
   finds that every result in the chapter is an n → ∞ limit. Write these as
   findings, not as gotchas — `verifying-an-article.md`'s "be fair to whatever
   the article argues against" applies hardest where the received account is
   most wrong.
2. **Four of the six have a `1/n` or `(n−1)/n` at the centre**, and that is
   not a coincidence: it is the same wedge between a private and a social
   margin, seen in four settings. Say so once, in the spine bridges, and let
   each article prove its own version. Do **not** build a "the 1/n article" —
   that is a survey, and the bar in `subject-queue.md` rules it out.
3. **Six shapes, six different ones**, and one of them is new to the project.
   The table in `choosing-the-shape.md` shows question-first at four uses and
   the starter skeleton at seven; this batch deliberately spends its variety
   budget. `perfect-competition` is the project's **first use of one steered
   simulation**, which the shape menu has carried unused since it was written.
4. **`gini-and-the-lorenz-curve` is the first article aimed squarely at model
   validation.** Its second half is about a scorecard, and the reader for that
   half is a practitioner who already reports the number. Keep the two halves
   the same length; the article's claim is that they are the *same
   construction*, and a lopsided article says otherwise.

## Cross-cutting rules (put these in every handoff)

1. **Re-derive before you build.** See the status note above.
2. **An invariance claim needs an oracle that could have seen the variable.**
   Four of these six are claims about an equilibrium, and an equilibrium
   computed from its own closed form proves nothing. Every spec below names
   the blind solver its checks must use: a golden-section over plant size, a
   sequential best response, a bisection on profit. One of them caught a real
   error at plan time — see rule 5.
3. **Two derivations sharing no code** for every headline number.
4. **`===` where the arithmetic is exact**, a stated tolerance elsewhere, and
   each tolerance says which of the two it is. Four recur here:
   - *machine precision* (identities): < 1e-12, usually ~1e-15;
   - *the flat-maximum floor* (~1e-7 to 1e-8): golden-section search near a
     quadratic maximum cannot beat √ε. Three of these six articles minimise a
     cost or maximise a payoff by search, and every one of them lands here.
     Assert within it and never call it exact;
   - *cancellation* (~1e-9 relative): a difference of two nearly equal large
     numbers, as in `perfect-competition`'s price gap. Divide by the natural
     scale and say in the check why the tolerance is what it is;
   - *sampling*: report the draw count in the prose and assert the rounding.
5. **A simultaneous best-response iteration diverges for n ≥ 5 and looks like
   a wrong formula.** The plan-time probe for `cartels` first updated every
   firm's quantity at once, which has eigenvalue −(n−1)/2 and blew up; the
   closed form was fine and the *solver* was wrong. Use **sequential**
   (Gauss–Seidel) best response, one player at a time, reading every rival's
   current quantity. This belongs in `house-idioms.md` in pass 4 of article 4.
6. **Spell reciprocal sums as a single division** — `1/B + 1/S` is one bit
   short of `(B+S)/(B*S)`. Carried over from `economics-next-three`, and
   articles 1 and 5 both hit it.
7. **Shared modules.** Each article builds exactly what the table above says
   and imports the rest. Copy plumbing, never shape (`scaffolding.md`). Keep
   `A, B, C, S`, `p0 = 20` and `q0 = 60` meaning the same thing wherever a
   linear market appears.
8. **Prose per `reference/writing-the-prose.md`** — "we" to narrate, "you" to
   instruct, whole sentences with the logic said out loud, at most one dash
   pair per paragraph, bold-then-define in the same sentence, British
   spelling, `Thanks for reading!` as its own paragraph.
9. **One hook, small interactions everywhere else**, and every one of them
   gets a browser check.
10. **Verify every citation before writing the sentence that leans on it.**
    This batch leans on more named results than any previous one — Viner,
    Chamberlin, Dixit–Stiglitz, Salant–Switzer–Reynolds, Gordon, Ostrom,
    Atkinson, Somers. Every one is from memory. Check or cut.
11. **Per-article budget**: 15–22 `ok()` blocks in `check-numbers.mjs`,
    50–150 assertions in `check-browser.mjs` at 390px and 1280px, including at
    least one rendered-pixel geometry assertion via `getScreenCTM()`.
12. **Three categorical colours, hard ceiling.** Article 1 draws a family of
    short-run curves and article 6 draws two whole distributions; neither may
    colour by category. Use a single-hue sequential ramp for the plant family
    (`house-idioms.md` has the violet one) and small multiples for the rest.

## Headline identities

| Article | The identity | Measured at plan time |
|---|---|---|
| `cost-curves` | the plant you build for an output is run at its own cheapest scale at **exactly one output**, and the offset is `(2k/(f+k))^(1/3)` — the textbook envelope picture is wrong everywhere else | worst 1.9e-8 (the search's flat-maximum floor) over 400 plant sizes, against a blind minimisation |
| `perfect-competition` | free entry cannot reach minimum average cost, because firms are whole numbers: the surviving profit is `(1+x)² − 1` fixed costs with `x = frac(n̄)/(Bd+n*)`, so the long-run supply curve is a sawtooth | ≈5e-10 worst relative over ~370,000 random markets (a cancellation tolerance) |
| `monopolistic-competition` | every result in the chapter is an n → ∞ limit: firm scale falls short of `f(σ−1)/c` by **exactly 1/n**, the markup exceeds `σ/(σ−1)` by **exactly 1/(σ(n−1))**, and the market makes **exactly (σ−1)/σ** varieties too many | 5.0e-11, 9.2e-11 and 3.9e-11 over 95 parameterisations |
| `cartels` | a merger of `k` of `n` Cournot firms is profitable only if `k(n−k+2)² < (n+1)²`; at n = 5, k = 4 the members' profit is **unchanged to the last bit** while the one firm that stayed out **quadruples** | exact integer equality; outsider ÷ member `= k` to 2.2e-16 over every (n,k) to n = 200 |
| `tragedy-of-the-commons` | with n users the equilibrium sets `(1−1/n)·AP + (1/n)·MP = w`, and for a square-root resource the rent dissipated is **exactly ((n−1)/n)²** — the second user does more damage than the next eight combined | 1.4e-15 over n = 1…4000; blind best response agrees to 3.0e-8 |
| `gini` | the Gini is the average gap between two people drawn at random, over twice the mean — and `2·AUC − 1` is that same construction applied to a ranking, so the scorecard number inherits the blindness exactly: two scorecards with **the same Gini** differ by **14.4 points** of bad capture in the top decile | three routes agree to 1.8e-14; accuracy ratio = 2·AUC − 1 to 6.9e-13 |

None of the six was the claim in the slate's "what it shows" column. Rewrite
those six rows in pass 4 — the slate's own instruction, and now six for six on
this line.

## Also owed

- **Twelve spine bridges.** Six insertions, each changing the bridge on both
  sides. Check the rendered index, not the manifest.
- **Pass-4 bookkeeping, every article**: a shape-table row, a queue tick, a
  slate status change and a corrected "what it shows" line, a
  `site/articles.json` entry whose blurb is the claim, and anything learned
  that is not about the subject folded into `reference/`.
- **Two `house-idioms.md` debts already visible**: the sequential-best-response
  rule (§5 above) and a note that a single-hue sequential ramp is the right
  answer for a *family* of curves, which article 1 is the first to need.
- **A `choosing-the-shape.md` note when article 2 ships**: one steered
  simulation will have been used once, and whether it worked is worth a
  sentence for the next subject that is iterative.
- **Stage 1 closes with this batch.** The pass-4 of article 6 should say so in
  `subject-queue.md`, and say what the Stage 1 macro brief will need that does
  not exist yet: a time-series panel, and the `data/` provenance machinery the
  slate flags for row 19.

## Environment reminders

The standing ones all apply (`house-idioms.md`, § Environment): `emptyOutDir`
stays false, GNU sed, always `<<'EOF'`, `sync; sleep 1` between a build and
anything that reads its output, `NODE_PATH` for the Linux rolldown bindings
when `node_modules` was installed on the Mac, read-only git in `site/` as
`git --no-optional-locks`, and `device_bash` cannot delete — scaffold by
selective copy.
