# `cost-curves` — pass-1 spec

**Kind** model · **Shape** build-up into an envelope lab · **Hook** `PlantLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 7 (Mi7); builds `src/cost.js`,
which `perfect-competition` imports; uses `MarketPanel.svelte` from
`supply-and-demand` for the one figure that has a price in it
**Closest analog by shape** `dbscan-hdbscan` — small figures, each making one
point, and the lab arrives only once the reader can use it.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

Ask the shape menu's question — *what must the reader be holding for the
interactive to mean anything?* — and the honest answer is three things: that a
cost curve has a fixed part and a variable part, that average and marginal are
different curves, and that a firm chooses a plant before it chooses an output.
None of those is free, and a plant-size lab shown cold is a picture of two
curves nobody has a reason to touch. So: three small figures, then the lab.

That is `dbscan-hdbscan`'s shape, and it is the right one for the same reason
— the object only becomes interesting once you know what the second curve is.

## The angle

The textbook draws a fan of short-run average-cost curves with the long-run
curve sitting underneath, and draws each short-run curve touching it at that
curve's own lowest point. That picture is right at exactly one output. At
every other output, the plant a firm builds is deliberately not the plant it
would be cheapest to run — a small firm builds a plant it will run **26% below**
its own most efficient scale, and a large one builds a plant it will run **23%
above**. The offset has a closed form, it is one line long, and the reason it
costs so little to be wrong about is the same reason the picture is wrong.

## The model

Capital `k` is fixed in the short run and chosen in the long run:

```
C(q, k) = f + r·k + w·q³/k          f = 100, r = 1, w = 1
SRAC(q, k) = C/q                    SRMC(q, k) = 3w·q²/k
k*(q)  = √(w/r)·q^1.5               the cost-minimising plant for output q
LRAC(q) = f/q + 2√(wr)·√q           LRMC(q) = 3√(wr)·√q
```

`w·q³/k` is the variable cost: more capital makes any output cheaper to
produce, and output gets dearer at the margin. `f` is a long-run fixed cost —
a licence, not a factory — which is what gives the long-run curve a minimum at
all.

The LRAC minimum is at `q = (f/√(wr))^(2/3) = 21.5443`, where
`LRAC = LRMC = 13.9248`. At that output the cost-minimising plant is
`k*(q) = 100`, which is exactly `f` — and that coincidence is the article.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | The long-run curve is the lower envelope of the short-run curves | **Exactly.** A blind golden-section minimisation over `k` at each of 600 outputs reproduces the closed-form LRAC to 5.947e-16 relative | `Envelope` |
| 2 | Marginal cost crosses average cost at average cost's minimum | True, and the sharper form is that **MC/AC is the elasticity of cost with respect to output**, so the crossing is the point where that elasticity is 1. Central difference against the ratio: 6.664e-9 over 500 outputs | `AverageAndMarginal` |
| 3 | Each short-run curve touches the long-run curve at the short-run curve's own minimum | **False at every output but one.** The tangency output over the plant's own cheapest output is `(2k/(f+k))^(1/3)`: 0.7368 at k = 25, 0.8736 at k = 50, **exactly 1 at k = 100**, 1.1696 at k = 400, 1.2347 at k = 1600. Blind SRAC minimisation against the closed form, 400 plant sizes, worst 1.892e-8 — the search's flat-maximum floor | `PlantLab` |
| 4 | — (**the identity**) | The ratio is 1 exactly when `k = f`, and that plant is the one that serves the minimum of the long-run curve. So the textbook picture is right at the one output the textbook uses to draw it | `PlantLab` readout |
| 5 | So the firm is running the wrong plant | **No — it is running the right plant at the wrong scale, and the two are different mistakes.** At the tangency the *marginal* curves do cross: SRMC = LRMC to 2.772e-16 over 400 outputs, even where SRAC is nowhere near its minimum. At q = 50 the chosen plant's own cheapest output is 43.12 | `MarginalCross` |
| 6 | — (why nobody notices) | Getting the plant wrong is second order: a 1% error in `k` costs 0.0043% of total cost, 10% costs 0.40%, and even a 50% error costs 7.3%. The envelope's flatness is what makes the drawing error invisible and the decision forgiving at the same time | `PenaltyFigure` |
| 7 | U-shaped average cost comes from diminishing returns | **It comes from a fixed cost meeting a rising marginal cost, and it needs both.** A fixed cost with constant marginal cost gives `f/q + 5`, which falls forever and has no minimum at any scale | `AverageAndMarginal` toggle |
| 8 | — (cost) | One variable input and one quasi-fixed one, no adjustment cost, no time for the plant to be half-built, and a technology chosen because it has closed forms. Everything here is about the shape of a cost function, not about where cost functions come from | limits |

## The identity on screen

`PlantLab`: the long-run curve, one short-run curve from a plant-size slider,
and two markers on that short-run curve — the tangency and the plant's own
minimum. The two markers slide past each other as the plant grows, crossing at
`k = f`, and a readout prints the ratio beside `(2k/(f+k))^(1/3)`. The
textbook picture is a preset: the reader can put the lab in the state the
textbook draws, see it is a single plant size, and move off it.

Behind the single curve, the rest of the family is drawn faint on a
single-hue sequential ramp — a family is not three categories and must not be
coloured as if it were (`house-idioms.md`).

## Layout

`CostSplit` (build-up 1: total cost as a fixed part and a variable part, with
a slider on output) → `AverageAndMarginal` (build-up 2: the two curves from
the same cost function, the crossing, and the toggle that removes the rising
marginal cost and takes the U with it) → `Envelope` (build-up 3: the family
and the curve underneath it, plant sizes appearing one at a time) → `PlantLab`
(the hook) → `MarginalCross` (the marginal curves crossing at the tangency, not
at the minimum) → `PenaltyFigure` (the second-order cost of the wrong plant)
→ limits.

## Non-overlap

- `markup-and-elasticity` and `tax-incidence` (live) own everything with a
  demand curve in it. **This article has no demand side.** One price line, in
  one figure, to say what a firm would do with these curves — and that is
  `perfect-competition`'s subject, which the spine bridge hands over to.
- `constrained-choice` (live) owns the frontier-and-indifference tangency.
  This is a different object — two cost curves touching — and the article
  should not reach for that diagram's language, because a reader who has met
  it will otherwise look for a budget line that is not there.
- `surplus-and-efficiency` (row 5) owns the area under a cost curve as
  producer surplus. Not used here.
- The minimum efficient scale as an entry barrier is `perfect-competition`'s.

## check-numbers.mjs

15–20 `ok()` blocks:

- the closed forms at the LRAC minimum with `===` where they are exact:
  `k*(q_min) === f`, and `LRAC === LRMC` there to < 1e-12.
- the envelope: blind golden-section over `k` against the closed-form LRAC at
  ≥ 500 outputs, worst relative < 1e-12. The search is the independent route
  for everything below it, so it is checked first.
- **the tangency identity**: blind minimisation of `SRAC(·, k)` against
  `(2k/(f+k))^(1/3)` over ≥ 300 plant sizes, worst relative < 1e-6, asserted
  **as the flat-maximum floor** with the reason named.
- the same identity a second way, from the closed-form `q_m(k) = (k(f+k)/2)^(1/3)`
  against `q_t(k) = k^(2/3)`, to < 1e-12 — so the claim does not rest on the
  search alone.
- the five ratio values quoted in the prose, at printed precision, and
  `ratio === 1` at `k === f` to < 1e-9.
- the envelope theorem: `SRMC(q, k*(q)) === LRMC(q)` over ≥ 300 outputs, worst
  relative < 1e-12.
- MC/AC against `d ln C / d ln q` by central difference, worst relative < 1e-7,
  with the differencing step stated.
- the penalty table at its five plant errors, and an explicit assertion that
  the penalty is `O(e²)` — **as a doubling test, not a fit**: `penalty(2e)/penalty(e)`
  is 3.998, 3.996, 3.992 and 3.980 at `e = 0.0005, 0.001, 0.002, 0.005`, so
  assert it is within 0.02 of 4. A fit of `κe²` over a wide range fails on a
  correct module, because `κ` drifts from 0.434 to 0.292 between `e = 0.01`
  and `e = 0.5` — the function is second order, not a parabola.
- the no-U case: `f/q + c` is strictly decreasing over ≥ 10,000 outputs and
  has no interior minimum.
- **the floating-point note**: any reciprocal sum in `cost.js` is spelled as a
  single division (`economics-next-six/README.md` §6).

## check-browser.mjs

50–150 assertions at both viewports:

- **the geometry assertion.** Map the tangency marker, the SRAC-minimum marker
  and the LRAC curve's sampled points through the element's own
  `getScreenCTM()`. Assert (a) the tangency marker's perpendicular distance to
  the LRAC path is < 0.5px at every slider position, (b) the two markers are
  more than 10px apart at the `k = 25` and `k = 400` presets, and (c) within
  1px of each other at the `k = f` preset. That single trio is claim 3 in
  rendered pixels, in both directions.
- sweep the plant slider on its step grid and assert the sign of
  (tangency x − minimum x) changes exactly once.
- `Envelope`: every short-run curve's rendered path lies on or above the
  long-run path at ≥ 30 sampled x positions — the envelope is a *lower* one,
  and a curve dipping below it is the single most likely drawing bug here.
- the faint family is drawn with a sequential ramp, not three categorical
  colours: assert at most three distinct stroke colours outside the ramp.
- name every series (`curve lrac`, `curve srac active`, `curve srac faint`,
  `dot tangency`, `dot srmin`) and select by name.
- `MarginalCross`: the rendered crossing of SRMC and LRMC sits within 1px of
  the tangency's x, and more than 10px from the SRAC minimum's x, at two
  presets.

## Sources

CORE U7 for cost curves; Viner (1931), *Zeitschrift für Nationalökonomie* 3,
for the envelope — including the famous instruction to his draughtsman to draw
the long-run curve through the minima of the short-run curves, which cannot be
done, and which is the historical version of this article's claim. **Verify
the Viner reference and the draughtsman story before writing the sentence that
leans on it** — it is widely retold and worth checking rather than repeating.
Theirs: the envelope, the story. Mine: the technology, the
`(2k/(f+k))^(1/3)` measurement, the penalty numbers, every figure.

## Risks

- **The draughtsman story is a gift and a trap.** It makes the article, and it
  is the one thing in the spec most likely to be slightly wrong in the
  retelling. If it cannot be re-checked, state the geometric claim without it;
  the measurement stands on its own.
- **`PlantLab` must not gain a second slider.** Plant size, and nothing else.
  The output is chosen by the two markers, not by the reader.
- **The faint family will fight the active curve.** Cap it at about seven
  curves, draw them before the active one, and check the contrast of the
  lightest ramp step against `--paper` rather than assuming the ramp in
  `house-idioms.md` clears it at that weight.
- **Claim 6 undercuts claim 3 if it is placed badly.** "The picture is wrong"
  followed immediately by "and it barely matters" reads as a retraction. Put
  the penalty figure after the marginal-crossing figure, so the sequence is
  *wrong → here is what is actually true → here is why it survived*.
- **q³ in the cost function is doing real work** and will look arbitrary. One
  sentence, early, on what it means: the third input unit costs three times
  what the first did, at any plant size.
