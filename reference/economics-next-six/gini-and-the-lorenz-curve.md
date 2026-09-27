# `gini-and-the-lorenz-curve` — pass-1 spec

**Kind** concept · **Shape** comparison spine · **Hook** `SameGiniLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 13 (Mi13); builds
`src/inequality.js`; copies `src/stats.js` from `population-stability-index`
**Closest analog by shape** `markup-and-elasticity` — two objects side by side
the whole way down, and the article is the accumulating difference.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

The article's claim is that one number cannot tell two things apart, and the
only honest way to build that is to hold the two things side by side from the
first figure to the last, with the number printed identically under both. A
lab first would show one distribution and have to *assert* the other; a
question first would spend its opening on a puzzle whose answer is the shape
of the whole piece.

The comparison spine also survives the article's structural oddity: it changes
subject halfway, from incomes to credit scores. The two panels carry that
change — the left one becomes scorecard A, the right one scorecard B — and the
reader crosses over without a new diagram to learn. That is the argument: it
is the same construction both times.

## The angle

The Gini is not a summary of a distribution. It is one number — the average
gap between two people picked at random, over twice the mean — read off a
whole curve, and two very different curves can enclose the same area. Two
populations with **identical Ginis** can be ranked opposite ways by any
consistent measure of inequality, and the switch happens at a specific
aversion. The same is true of the number a credit-risk team reports every
month, because `2·AUC − 1` **is** a Gini, of the same construction applied to
a ranking instead of to incomes. Two scorecards with the same Gini differ by
**14.4 points** of bad capture in the top decile, in opposite directions at
the two ends — and the top decile is usually the only part anyone acts on.

## The model

Two halves, one construction.

**Incomes.** For a finite population, three routes to the Gini that share no
algebra: the mean absolute difference over twice the mean; the ranked
covariance form; and one minus twice the area under the Lorenz curve.
Inequality is compared with Atkinson's index at aversion `ε`.

**Scores.** A scorecard gives every account a score; some accounts are bad.
AUC is `P(score of a bad > score of a good)`, computed two ways — by ranks and
by counting every pair. The CAP curve plots the fraction of bads captured
against the fraction of the population taken from the top, and the accuracy
ratio is its area above the diagonal over the perfect model's. Capture at a
cut-off is the fraction of bads inside the top `x%`.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | The Gini measures inequality | It measures one thing exactly: **the average gap between two people drawn at random, over twice the mean.** Three independent routes agree to 1.8e-14 over 30 random populations | `ThreeRoutes` |
| 2 | A higher Gini means more inequality | **Only when the Lorenz curves do not cross.** Two populations — 30% at 4 with 70% at 10, against 85% at 8 with 15% at 19.7688 — have Ginis equal to 1.03e-14. The first gives its poorest 30% **14.63%** of income and the second gives them **24.58%**; the first gives its richest 15% **18.29%** and the second gives them **30.37%** | `SameGiniLab` |
| 3 | — (**the consequence**) | Atkinson's index ranks them **opposite ways either side of ε = 0.4633**: below it the second is worse, above it the first is, and at ε = 8 the first reads 0.4210 against the second's 0.1616, a factor of 2.605. The Gini says they are identical at every aversion, because the Gini is one point on that family | `AtkinsonFigure` |
| 4 | For a given Gini you know roughly what the distribution looks like | **Only inside a family.** For a lognormal the Gini is exactly `2Φ(σ/√2) − 1`, so one number *is* the distribution — and a Pareto matched to the same Gini of 0.4 gives its top 1% **13.90%** of income against the lognormal's **5.65%**, and its top 0.1% **5.18%** against **0.94%**: factors of 2.46 and 5.50 | `TopShareFigure` |
| 5 | The scorecard "Gini" is a different thing with the same name | **It is the same construction.** The accuracy ratio computed from the CAP curve equals `2·AUC − 1` to 6.9e-13 over five scorecards, and AUC by ranks equals AUC by counting every pair **exactly** (gap 0.000e+0 on the same sample) | `CapFigure` |
| 6 | — (**so it inherits the blindness exactly**) | Two scorecards whose Ginis agree to under half a point (0.5227 and 0.5240 under the shipped probe's seed): in the top 1% they catch 3.4% and 4.0% of bads, in the top 10% **25.6% and 40.0%** — 14.4 points apart — and in the top 50% 77.7% and 72.6%, which is 5.1 points the other way. The CAP curves cross, exactly as the Lorenz curves did | `SameGiniLab` right panel |
| 7 | So use the Gini to choose between scorecards | **It cannot tell you which one to deploy**, because the choice depends on where you cut, and the number is an average over every cut including the ones nobody uses. What the number does tell you is one honest thing, and the article should say what | `CutFigure` |
| 8 | — (cost) | The scorecard construction is deliberately stylised — one scorecard separates uniformly, the other separates half the bads cleanly and none of the rest — and real scorecards differ less dramatically. The direction is the finding; the 14.4 points is this construction's. Nothing here is about calibration, which is a different failure with a different diagnostic, or about thresholds, which is `f1-score`'s | limits |

## The two comparisons

**Incomes.** A: 30% at 4, 70% at 10. B: 85% at 8, 15% at 19.7688. Gini
0.15365854 both.

| | poorest 30% | richest 15% | Atkinson ε=0.25 | ε=1 | ε=8 |
|---|---|---|---|---|---|
| A | 14.63% | 18.29% | 0.016701 | 0.073588 | 0.420963 |
| B | 24.58% | 30.37% | 0.017952 | 0.061710 | 0.161570 |

Ranking switches at ε = 0.463302.

**Scorecards.** A: every bad's score shifted by 1.0. B: a fraction `λ` of bads
separated cleanly, the rest indistinguishable from goods. Setting `λ` to A's
Gini matches the two, because **B's Gini is exactly `λ`** — an analytic
prediction worth asserting in its own right. Under the shipped probe's seed
that is 0.5227 against 0.5240, and the residual is sampling.

| cut-off | A catches | B catches | difference |
|---|---|---|---|
| top 1% | 3.353% | 4.000% | +0.65 |
| top 5% | 14.175% | 20.000% | +5.83 |
| top 10% | 25.567% | 40.000% | **+14.43** |
| top 20% | 43.293% | 55.827% | +12.54 |
| top 30% | 57.650% | 61.453% | +3.80 |
| top 50% | 77.665% | 72.550% | −5.12 |
| top 80% | 95.160% | 88.867% | −6.29 |

## The identity on screen

`SameGiniLab`: two panels, one curve each, with the enclosed area shaded and
the Gini printed under both — identical to four decimals, at every setting the
reader can reach. A single toggle switches both panels from **incomes** to
**scores**, redrawing the Lorenz curves as CAP curves, and the number under
each panel does not move. That toggle is the article: the same shaded area,
the same number, the same blindness, on two objects that are never taught
together.

Under the panels, a cut-off slider prints what each side actually delivers at
that cut — income share below the cut in one mode, bads caught above it in the
other — and those two readouts differ while the Gini readouts do not.

## Layout

`TwoPopulations` (the case: A and B side by side, incomes only, both Ginis
printed) → `ThreeRoutes` (what the number is: the pairwise-gap definition
computed three ways, agreeing) → `TheCrossing` (the two Lorenz curves, the
crossing point, the two shares) → `AtkinsonFigure` (the ranking against
aversion, crossing at 0.4633) → `TopShareFigure` (lognormal against Pareto at
the same Gini) → `SameGiniLab` (the hook, with the incomes/scores toggle) →
`CapFigure` (`2·AUC − 1` is the same area: the accuracy ratio and the
rank-based AUC printed side by side) → `CutFigure` (capture against cut-off,
the two scorecards crossing) → limits.

The article changes subject at `SameGiniLab` and must not apologise for it.
One sentence of bridge, and the toggle does the rest.

## Non-overlap

- `f1-score` (live) owns precision, recall and **where to put the threshold**.
  This article is about the quality of the *ranking*, which is what AUC
  measures and what F1 does not; claim 7 and the limits section both say so,
  and the spine bridge between them is worth writing carefully because they
  are the two articles a model validator will read together.
- `population-stability-index` (live) owns drift monitoring and the
  chi-square law. Different statistic, same reader; copy `stats.js` and leave
  the rest.
- `surplus-and-efficiency` (row 5) owns welfare as total surplus. Atkinson's
  index here is an *inequality* index, not a surplus measure, and the article
  should not let the two words meet.
- `bargaining-and-the-surplus` (live) owns the split of a surplus and the
  independence of efficiency and fairness. One sentence of link at most: this
  article is about measuring a distribution, not choosing one.
- `wealth-inequality-dynamics` (Ma61, far out) will want `inequality.js`.
  Build it to be imported: pure functions, no article-specific constants.

## check-numbers.mjs

17–22 `ok()` blocks:

- **the three routes** agree over ≥ 30 seeded random populations, worst
  relative < 1e-10 for each pair. First, because every other number is one of
  them.
- the Gini of a two-point population against the closed form
  `p(1−p)(b−a)/μ`, exact.
- the lognormal closed form `2Φ(σ/√2) − 1` against a ≥ 200,000-draw
  simulation at five σ, asserted **to the rounding the prose prints**, with the
  draw count in the sentence — this is a sampling claim.
- the crossing pair: the two Ginis agree to < 1e-12, and the four share
  numbers at printed precision.
- **the Atkinson switch**: the sign of `A(A,ε) − A(B,ε)` changes exactly once
  over `ε ∈ (0, 10]`, located by bisection at 0.4633 to < 1e-5, and the ε = 8
  values at printed precision. Assert the *single* crossing, not just its
  location.
- the top-share comparison: the Pareto closed form `p^((α−1)/α)` against a
  quantile integration of the lognormal, both at 1% and 0.1%, with the
  integration's tolerance stated.
- **AUC by ranks `===` AUC by counting every pair** on the same sample, five
  scorecards, gap exactly 0 — this one can be `===`, and should be.
- **the accuracy ratio `=== 2·AUC − 1`**, five scorecards, worst < 1e-10.
- the two scorecards' Ginis agree to the sampling tolerance (< 5e-3 at 30,000
  bads and 90,000 goods), with the draw count reported, **and** the analytic
  prediction `λ = Gini` for scorecard B is asserted separately to the same
  tolerance — it is the reason the construction works and it should not be
  hidden inside the Gini equality.
- the capture table, all seven rows, at printed precision, **and** the sign
  change: the difference is positive at the top and negative at the bottom,
  asserted as a crossing.
- tie handling: a scorecard with deliberate ties gives the same AUC by both
  routes (midpoint ranks), asserted explicitly — this is where an AUC
  implementation is usually wrong and where a validator will look first.

## check-browser.mjs

50–150 assertions at both viewports:

- **the geometry assertion.** Measure the **rendered** area between each
  panel's curve and its diagonal, by sampling the path through
  `getScreenCTM()` and integrating in screen pixels, and assert the two areas
  agree to within 0.5% while the two curves cross — a crossing asserted by
  finding a sampled x where the sign of (A's y − B's y) differs from another.
  Equal areas, crossing curves, in pixels: that is the whole article in one
  assertion, and it must hold in **both** modes of the toggle.
- flipping the incomes/scores toggle leaves both Gini readouts unchanged to
  the printed precision while both curve paths change.
- the cut-off slider: the two capture readouts differ by more than 10 points
  at the top-10% position and have opposite sign at the top-50% position.
- `AtkinsonFigure`: the two rendered series cross exactly once, and the
  crossing's x maps back to ε = 0.4633 to within 1px.
- small multiples in `TopShareFigure` share a bounding-rect `top` at desktop
  and do not on mobile.
- name every series (`curve lorenz a`, `curve lorenz b`, `curve cap a`, …) —
  this article has two like-classed curves in one panel, which is exactly the
  `constrained-choice` selector trap.
- no LaTeX reaches the DOM unrendered; the Φ and ε in the prose are KaTeX.

## Sources

CORE U5.12 for the Lorenz curve and the Gini; Gini (1912) for the mean
difference; Atkinson (1970) *JET* 2(3):244–263 for the index and the
Lorenz-dominance theorem that claim 3 is an instance of; Somers (1962) *ASR*
27(6):799–811 for the rank correlation that `2·AUC − 1` is; Hanley & McNeil
(1982) *Radiology* 143(1):29–36 for the Mann–Whitney identity behind the AUC.
**Verify every one before writing the sentence that leans on it** — five
citations is more than any article in this project has carried, and the two
from outside economics are the ones most likely to be misremembered. Theirs:
the definitions and the theorems. Mine: the matched pair, the switch point,
the matched scorecards, the 14.4 points, every number.

## Risks

- **The article changes subject halfway and that is its biggest risk.** The
  toggle has to arrive as a revelation rather than as a second article
  starting. Build the bridge sentence first, before any component, and if it
  does not write itself in one sentence, the two halves are not as close as
  the spec thinks and the article needs rethinking.
- **The scorecard construction is stylised and a practitioner will say so.**
  Say it first, in claim 8's language, in the prose next to the figure — not
  only in limits. An honest stylised example beats a realistic one that has to
  be defended.
- **14.4 points is this construction's number, not a law.** Quote it with the
  construction attached every time, exactly as `comparative-advantage` quotes
  "about 12%" with its generator.
- **Atkinson's ε will lose readers** unless it is given a plain-language
  handle in the same sentence it is named: how much you are willing to give up
  in total to make the split more even. Bold-then-define, once.
- **Do not let the article become a survey of inequality measures.** Theil,
  the Palma ratio, the coefficient of variation, all of them earn a mention
  and none of them earns a figure. One number, one curve, two objects.
- **The lognormal Gini uses Φ**, and a hand-rolled normal CDF is a real source
  of quiet error. Take it from `stats.js`, which
  `population-stability-index` already proved, rather than writing a new one.
