# `elasticity` — pass-1 spec

**Kind** concept · **Shape** lab first · **Hook** `RulerLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 4 (Mi4); copies
`src/demand.js` from `markup-and-elasticity` and adds the ruler, the two
two-point formulas and the revenue helpers
**Closest analog by shape** `efficiency-wages` — one object, dragged, and the
whole article is an examination of it.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

A demand curve with a point you can drag along it is legible cold, which is
the test `choosing-the-shape.md` sets for lab first. Everything in this
article is a property of *that point*: the elasticity, the two tangent
segments, the revenue rectangle. There is nothing to earn first, and a
build-up would be three figures explaining an object the reader could already
have been holding.

Lab first has been used once (`efficiency-wages`). That is a precedent, not a
saturated pattern, and this subject wants it for a different reason: there the
object was a ray from the origin and the article was about where it lands;
here the object is a point and the article is about what can be read off it.

## The angle

"Elastic" and "inelastic" are not properties of a good. On one straight demand
line the elasticity runs from 0 to ∞ and takes every value in between, so the
same good is both, at different prices, on the same curve. What the number
actually is, is a **ratio of two lengths**: the point cuts its own tangent
into two pieces, and the elasticity is the upper piece over the lower one — on
every demand curve ever drawn, not only straight ones. And the two formulas
everybody is taught for computing it from two observations are each exactly
right for exactly one demand curve, which is the curve they silently assume.

## The model

One family, pinned so that every member passes through the same point
(25, 45) — the pin `markup-and-elasticity` already uses, so a reader who has
met the diagram is not relearning it. Five members, chosen to span the
curvature rather than to be famous:

| id | q(p) | \|ε\| at the pin |
|---|---|---|
| `lin` | 75 − 1.2·p (so P_max = 62.5) | 0.666667 |
| `ces` | k·p^(−1.6) | 1.600000 |
| `exp` | k·e^(−0.05·p) | 1.250000 |
| `quad` | k·(80 − p)² | 0.909091 |
| `logit` | M/(1 + e^((p−30)/12)) | 0.827739 |

Each carries `q(p)` and `q′(p)` in closed form, so `|ε| = |q′·p/q|` is one
line and every other quantity in the article is derived from those two.

The tangent at `(p, q)` meets the quantity axis at `(0, q − p·q′)` and the
price axis at `(p − q/q′, 0)`. The **upper segment** is from the point to the
quantity axis; the **lower segment** is from the point to the price axis.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | Elasticity is the slope, made unit-free | **Half right, and the half that is wrong is the interesting half.** Re-express price in cents and quantity in grams and the slope changes by 10× while the elasticity is bit-for-bit identical (`===`) — but the slope is constant along a straight line and the elasticity is not | `RulerLab` readouts |
| 2 | Some goods are elastic and some are inelastic | **Not a property of a good.** On the straight line through (25, 45): \|ε\| = 0.087 at p = 5 and 24.0 at p = 60 — a factor of 276 on one curve. It is inelastic on exactly the lower half of its price range and elastic on exactly the upper half | `RulerLab` |
| 3 | — (the straight-line closed form) | \|ε\| = p/(P_max − p), and equivalently (q_max − q)/q: 7.580e-13 worst relative gap over 20,000 prices. Unit elasticity sits exactly at the midpoint of *both* axes | `RulerLab` |
| 4 | — (**the identity**) | \|ε\| = upper tangent segment ÷ lower tangent segment, on **every** curve: worst relative gap 4.5e-15 across all five families, 3,000 points each (lin 4.549e-15, ces 4.163e-16, exp 2.577e-15, quad 3.829e-15, logit 4.509e-15) | `RulerLab` |
| 5 | Revenue peaks where \|ε\| = 1 | **True, and not only for straight lines**, because d ln R / d ln p = 1 − \|ε\| identically: a central difference tracks the closed form to 6.7e-11 (ces), 3.4e-10 (exp), 4.7e-10 (logit). Golden-section peaks: lin 31.250001, exp 20.000000, quad 26.666666, logit 27.179517, each with \|ε\| = 1 to 4e-8 — the flat-maximum floor, not a tolerance to tighten. The constant-elasticity curve has \|ε\| = 1.6 everywhere and therefore **no peak at all** | `RevenueFigure` |
| 6 | Compute it from two observations with the midpoint formula | **That formula is exactly the point elasticity at the midpoint price — but only on a straight line**, where it is exact at *any* gap: 1.9e-14 worst over 20,000 random pairs, and p 10 → 60 (a 500% price change) gives 1.272727272727, which is the point elasticity at 35 to twelve places | `FormulaFigure` |
| 7 | — (the reason nobody states) | On a straight line the mean of the two quantities **is** the quantity at the mean price (7.1e-15 worst over 20,000 random pairs). On the constant-elasticity curve they are 0.52% apart at a 10% price gap, 14.2% at 50% and 77.7% at 100% | `FormulaFigure` |
| 8 | — (the mirror) | The log-difference formula is exact on the constant-elasticity curve at any gap (2.4e-11) and wrong on the line. Each formula is the point elasticity of the family it assumes; choosing a formula **is** choosing a demand curve, silently | `FormulaFigure` |
| 9 | — (what it costs) | Two observations, (20, 57) and (30, 33), give four defensible answers: 0.842 from the first point, 2.182 from the second, 1.333 from the midpoint formula, 1.348 from the log difference — a spread of 2.59× from the same two numbers. The midpoint answer is exactly the straight line through both points evaluated at p = 25; the log answer is exactly the constant-elasticity curve through both points | `TwoPointsFigure` |
| 10 | — (cost) | Own-price only, one period, no income effects, and the whole article is about a curve someone has already drawn. Where the curve comes from is the previous article's subject, and what a firm does with the number is the next one's | limits |

## The drift, for `FormulaFigure`

Both formulas applied to the family they are not exact for, as the gap between
the two observed prices grows:

| price gap | midpoint formula on constant-elasticity (truth 1.6) | log formula on the line (truth = point ε at the midpoint) |
|---|---|---|
| 1% | −0.0013% | −0.0005% |
| 10% | −0.1299% | −0.0464% |
| 25% | −0.8072% | −0.2918% |
| 50% | −3.1663% | −1.1975% |
| 100% | −11.7672% | −5.3605% |

Both understate, and both are fine at the gaps a textbook exercise uses, which
is why nobody notices. Say that; do not oversell a 0.1% error.

## The identity on screen

`RulerLab`: the curve, one draggable point, and the tangent drawn through it
all the way to both axes. The two segments are drawn in different weights with
their lengths printed beside them, and a third readout prints the ratio next
to `|q′·p/q|` — two numbers from two unrelated routes, agreeing to every
digit shown, on whichever of the five curves the reader has selected. The
segments are the figure; the algebra is the caption.

Unit elasticity is then something the reader can *see*: the point where the
tangent is cut exactly in half.

## Layout

`RulerLab` (hook: the curve family on a small selector, one draggable point,
the tangent, the two segments, the readouts) → `AlongTheLine` (the same
straight line at six prices, a small-multiple strip: 0.087, 0.25, 0.667, 1.0,
4.0, 24.0, with the revenue rectangle under each) → `RevenueFigure` (revenue
against price with the peak marked, and beside it d ln R / d ln p against
price crossing zero at exactly the same place; the constant-elasticity curve
selectable, with no peak) → `TwoPointsFigure` (two observations, four answers,
and a toggle that draws the line and the constant-elasticity curve through
them) → `FormulaFigure` (the drift table as a chart: error against price gap,
both formulas, log-x) → limits.

`AlongTheLine` is a strip of small multiples, not a second lab — the point
is that one curve is holding all six of them.

## Non-overlap

- `markup-and-elasticity` (live, slate row 9) owns **markup = 1/\|ε\|**, the
  Lerner rule, the monopoly optimum and **pass-through ρ = n/(1+n)**. None of
  those appears here. Copy `demand.js`'s pinned-family construction and leave
  `optimalPrice`, `numericOptimal`, `passThrough` and `numericPassThrough`
  behind — importing them is how the two articles start arguing with each
  other.
- That article's claim 3 is "elasticity at a point does not tell you the
  price", proved with two curves and a cost change. **Do not restate it**, and
  in particular do not build a figure whose message is "five curves through
  one point behave differently". The five curves here exist so that the
  segment ratio can be shown to hold on all of them, which is a claim about
  the ruler, not about the curves.
- `tax-incidence` (live) owns the elasticity-ratio burden share and its
  first-order failure. No taxes here.
- The spine bridge into this article comes from `supply-and-demand`, which
  ends holding a number it cannot pin down; the bridge out goes to
  `surplus-and-efficiency`, which needs the area under the curve rather than
  the slope at a point.

## check-numbers.mjs

15–20 `ok()` blocks:

- the pin: all five families return `q(25) = 45` to < 1e-12, and each returns
  its stated `|ε|` at the pin to < 1e-12.
- the straight-line closed form `|ε| === p/(P_max − p)` and `=== (q_max − q)/q`
  over a fine price grid, worst relative < 1e-12, plus `|ε| === 1` exactly at
  `P_max/2`.
- the six quoted elasticities along the line, each asserted at the precision
  the prose prints.
- **the segment identity**, per family, ≥ 3,000 points each, worst relative
  < 1e-12 — five `ok()` blocks or one that names the worst family, but the
  family must be named in the failure message.
- the segment identity computed a second way, from the two intercepts rather
  than from the lengths, so the assertion is not just the same algebra twice.
- `d ln R / d ln p === 1 − |ε|` by central difference, per family, restricted
  to the domain where `q` is at least 1% of `q(25)` — the linear and quadratic
  families' worst gaps (3.9e-6 and 1.6e-7) both sit at the domain edge where
  `q → 0`, and the check should say so rather than carry a loose tolerance for
  the whole range.
- the revenue peak by golden section, per family, with `|ε| = 1` there to
  < 1e-6, asserted **as the flat-maximum floor** and not as an identity; plus
  the constant-elasticity family asserted to have no interior peak.
- the midpoint formula against the point elasticity at the midpoint price on
  the line, over ≥ 5,000 random pairs with no restriction on the gap, worst
  relative < 1e-10.
- the reason: mean of the two quantities minus the quantity at the mean price
  on the line, worst < 1e-12; and the three constant-elasticity gaps (0.52%,
  14.2%, 77.7%) at their printed precision.
- the log-difference formula against ε on the constant-elasticity family, same
  shape, worst relative < 1e-10.
- the drift table, both rows, at the five gaps, at printed precision.
- the four two-point answers as exact fractions where they are exact
  (0.842105…, 2.181818…, 1.333333…) and the log answer to < 1e-9; plus the two
  equalities that make claim 8 a claim — midpoint answer `===` line-at-midpoint
  and log answer `===` the CES exponent, both < 1e-12.
- units: the elasticity under the rescaling is `===` the original, and the
  slope is not.

## check-browser.mjs

50–150 assertions at both viewports. The article-specific half:

- **the geometry assertion, and it is the best one available to this
  project.** Map the point, both tangent endpoints and both axis intercepts
  through the tangent element's own `getScreenCTM()`, measure the two segment
  lengths **in rendered pixels**, and assert their ratio equals the printed
  elasticity to 0.5%. Do this at three positions on each of at least three
  curves. This single assertion runs the model, the tangent construction, the
  scales and both coordinate transforms through one number — the shape
  `verifying-an-article.md` says is worth writing every time. A bounding-rect
  test on a diagonal line gives its box, not its direction: transform the
  points yourself (`comparative-advantage`'s precedent).
- at the point where the printed elasticity is 1, assert the two rendered
  segment lengths are equal to within 0.5px.
- drag the point along the line on its step grid and assert the printed
  elasticity is strictly increasing in price across ≥ 20 positions.
- `RevenueFigure`: the rendered x of the revenue peak marker and the rendered
  x of the zero crossing of the log-log slope agree to < 1px, on three
  families; and on the constant-elasticity family neither marker is drawn.
- name each series (`seg upper`, `seg lower`, `curve lin`, `curve ces`, …) and
  select by name.
- the tangent is clipped to the plot, not drawn to a large number
  (`clipRayThroughOrigin`'s reason) — assert nothing is drawn outside the SVG.

## Sources

CORE U7.5 for the definition; Marshall, *Principles of Economics* (1890),
Book III ch. iv and the Mathematical Appendix, for the point-elasticity
definition and the tangent-segment construction, which is classical geometry
and not this article's. **Verify the book, edition and location before writing
the sentence**, and if it cannot be re-checked, state the construction without
attributing it rather than attributing it loosely. Theirs: the definition, the
geometric reading. Mine: the five-family measurement of the segment ratio, the
two-formulas-two-families result, the two-point spread, every number.

## Risks

- **The ruler is a classical result and must be presented as one.** The
  contribution here is that it is *measured on five curves* and put on screen
  as a draggable object, not that it is new. `population-stability-index` is
  the model: cite the theorem, own the picture.
- **Do not let `RulerLab` carry the revenue rectangle as well.** One
  manipulable object; revenue is `RevenueFigure`'s. If the rectangle ends up
  in the lab, the lab has two claims and neither lands.
- **The tangent at a near-vertical part of the curve runs off the panel.**
  Clip it and clamp the draggable point's range so both segments are always
  visible, or the identity's figure is sometimes a figure of one segment.
- **The 276× number is doing a lot of rhetorical work.** It depends on how far
  up the line the last point sits. Quote the prices with it every time it
  appears, and prefer the 0.087-to-24 pair over the bare ratio in the
  conclusion.
- **Claim 8 is the best paragraph in the article and it is one sentence long.**
  Resist growing it into a section about functional-form assumptions. The
  measurement is the argument.
