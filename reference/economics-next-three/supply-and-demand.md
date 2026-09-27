# `supply-and-demand` — pass-1 spec

**Kind** model · **Shape** question first, entered through a one-figure setup
band, turning into an assumption lab · **Hook** `CloudLab`
**Stack** Svelte 5 + Vite · **Queue** slate row 3 (Mi3); builds
`src/market.js` (copied from `tax-incidence`, extended) and
`src/Components/MarketPanel.svelte`, which `surplus-and-efficiency` imports
**Closest analog by shape** `comparative-advantage` — question first until the
reader's own procedure fails, then the hidden variable on a slider.
Planned 17 Sep 2026; re-derive all numbers in pass 1.

## Shape reason

The received account here is a **procedure**, not a statement: collect prices
and quantities, fit a line, call it demand. `choosing-the-shape.md` records
that as the identified signal for question first — three for three, and this
is the cleanest instance yet, because the reader can literally draw the line.
So: one setup figure (two curves, one crossing, and nothing else), then the
question — *here are eighteen months of this market; draw the demand curve* —
then the reveal, then the shock mix on a slider.

The setup band is not a fourth shape. It is the build-up entry the CORE plan
settled in article 1's pass 4: the reader cannot be asked what a cloud of
crossings means until they have watched one crossing move.

## The angle

A line fitted through a market's prices and quantities is a weighted average
of the demand curve and the supply curve, weighted by which one was moving.
It is neither curve, it can slope upward, and its **R² is not a measure of
fit — it is exactly the reciprocal of the factor by which the data fails to
pin the demand curve down.** A cloud with R² = 0.22 leaves the demand
elasticity free over a range of 4.6×, and the two ends of that range are the
two stories a reader can tell about the same picture.

## The model

The base market, identical to `tax-incidence`'s so the axes read the same:

```
demand:  q = A − B·p + u,   u ~ N(0, τd²)
supply:  q = C + S·p + v,   v ~ N(0, τs²)
A = 120, B = 3, C = 20, S = 2  →  p₀ = 20, q₀ = 60
```

`u` and `v` are independent. Each period the market clears; the observation
is the pair `(p, q)`. Write `w = τd²/(τd² + τs²)` — the **demand-shock
share** — which is the slider.

**The equilibrium must be found by a route that reads both curves and both
shocks.** Bisect excess demand `(A − B·p + u) − (C + S·p + v)` and return the
average of the two sides, so neither equation is privileged. Solving from one
equation makes claim 1 or claim 2 true by construction, which is the trap
`verifying-an-article.md` names.

Closed forms, for the population moments:

```
Var(p) = (τd² + τs²)/D²        D = B + S
Var(q) = (S²τd² + B²τs²)/D²
Cov    = (S·τd² − B·τs²)/D²
OLS slope of q on p  =  w·S − (1−w)·B
R²                   =  Cov²/(Var(p)·Var(q))
```

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | You can see the demand curve in market data | **Only when supply is the only thing moving.** With supply-only shocks the solver that reads both curves puts every observation on the demand curve to 1.4e-14 — and the same solver puts the demand-only observations more than 40 units away from it (48.0 under the shipped probe's seed), so it could have failed | `CloudLab` presets |
| 2 | Then a downward-sloping cloud is a demand curve | **No.** With demand-only shocks the cloud lies exactly on the *supply* curve (1.4e-14) and slopes **up**; the cloud's direction identifies which curve was still, not which curve it is | `CloudLab` |
| 3 | — (the mechanism) | The fitted slope is `w·S − (1−w)·B`, a straight line in `w` running from the demand slope at `w = 0` to the supply slope at `w = 1`. Covariance algebra against the convex combination: 2.665e-15 worst over 200,000 random markets. Equivalently the fitted line divides `[−B, S]` in exactly the ratio `τd²/τs²` (2.814e-14 worst over 300,000) | `MixFigure` |
| 4 | A flat cloud means quantity does not respond to price | **False, and it is the most misread case.** The cloud is exactly flat at `w* = B/(B+S) = 0.6`, where neither curve is flat and both are steep. Bisection root against the closed form: 1.1e-16; 400,000 simulated draws give a slope of 1.0e-3 and an R² of 1.7e-7 | `CloudLab` preset |
| 5 | A high R² means the line is trustworthy | **Backwards.** R² = 1 exactly at both ends — where the cloud lies on a curve — and 0 at the flat point. A perfect fit says one curve was still; it never says which | `R2Figure` |
| 6 | — (**the identity**) | The markets consistent with the observed moments form a one-parameter family whose demand slope runs from `−Cov/Var(p)` (the forward OLS slope) to `−Var(q)/Cov` (the reverse regression), and **`B_hi/B_lo = 1/R²` exactly**: 4.812e-16 worst relative gap over the 199,843 downward-sloping draws in 400,000 random markets, with the true slope inside the bracket 199,843 times out of 199,843 (smallest relative slack 3.7e-4) | `BracketFigure` |
| 7 | With enough data the problem goes away | **No — it is not a sample-size problem.** The family in claim 6 reproduces all three second moments to 7.1e-15; more draws sharpen the moments and change the bracket by nothing. What breaks it is a variable that shifts one curve and not the other: a supply shifter recovers the demand slope to 4.4e-15 by a noise-free two-point route, while OLS on the same market returns **+0.787 against a truth of −3** — the wrong sign | `ShifterFigure` |
| 8 | — (cost) | Linear curves, additive independent shocks, one market, no dynamics, and a shifter assumed excluded from demand rather than shown to be. The bracket is an identified set under *these* assumptions, which is the honest form of every such bound | limits |

## The worked case the article carries

`B = 3, S = 2, τd² = 35, τs² = 65` → Var(p) = 4, Var(q) = 29, Cov = −5,
fitted slope −1.25, R² = 0.215517.

| B | S | τd² | τs² | demand elasticity at (20, 60) |
|---|---|---|---|---|
| 1.50 | 21.500 | 23.0 | 2093.0 | 0.500 |
| 2.00 | 6.333 | 25.0 | 252.8 | 0.667 |
| 2.50 | 3.300 | 29.0 | 105.6 | 0.833 |
| **3.00** | **2.000** | **35.0** | **65.0** | **1.000 ← the truth** |
| 4.00 | 0.818 | 53.0 | 39.9 | 1.333 |

Every row reproduces Var(p), Var(q) and Cov to ≤ 7.1e-15. The family runs
from B = 1.25 (supply perfectly elastic) to B = 5.8 (supply perfectly
inelastic), so the demand elasticity is pinned only to **[0.417, 1.933]** — a
factor of 4.64, which is 1/0.215517.

The collapse, for `R2Figure`:

| supply-shock share | R² | B_lo | B_hi | bracket ratio |
|---|---|---|---|---|
| 1.000 | 1.000000 | 3.000 | 3.000 | 1.00 |
| 0.990 | 0.972346 | 2.950 | 3.034 | 1.03 |
| 0.900 | 0.735294 | 2.500 | 3.400 | 1.36 |
| 0.700 | 0.300000 | 1.500 | 5.000 | 3.33 |
| 0.500 | 0.038462 | 0.500 | 13.000 | 26.00 |

Below a supply-shock share of 0.4 the cloud slopes upward and no
downward-sloping demand curve is admissible at all — state that as the
boundary rather than letting the figure run off the end of its own logic.

## The identity on screen

`BracketFigure`: the scatter with three lines through it — the forward
regression, the reverse regression, and the truth — and beside it a single
horizontal bar showing the admissible range of the demand elasticity, whose
length is driven directly by the R² readout. As the shock mix moves, the two
regression lines scissor apart and the bar grows, and the readout prints the
bracket ratio and 1/R² side by side, agreeing to three decimals.

The reverse regression is the part nobody draws. Draw it.

## Layout

`TwoCurves` (setup band: the two curves, one crossing, a shift button that
moves one of them and walks the crossing along the other — the whole idea in
one figure) → `TheQuestion` (eighteen months of the market; the reader drags
a line through the cloud, and a readout scores it against both truths, which
are hidden until they commit) → `CloudLab` (hook: the demand-shock share on a
slider, the true curves faint behind the cloud, the fitted line live, presets
for `w = 0`, `w = w*` and `w = 1`) → `MixFigure` (the fitted slope against
`w`, a straight line from −B to S, with the reader's own guess marked) →
`R2Figure` (R² against `w`: 1 at both ends, 0 in the middle) →
`BracketFigure` (the identity) → `ShifterFigure` (one variable that moves
supply only, and the slope comes back) → limits.

`TheQuestion` is a small interaction, not a second hook: one draggable line,
no parameters. It exists so the reader owns a wrong answer before claim 3
arrives.

## Non-overlap

- `tax-incidence` (live) owns the **wedge**, the statutory invariance, the
  linear burden share and the Laffer identity. This article has no tax in it.
  Do not shade a deadweight-loss triangle anywhere; that is article 3's.
- `markup-and-elasticity` (live) owns **markup = 1/\|ε\|** and pass-through.
  This article prints an elasticity only as the thing the bracket fails to
  pin down, and does not explain what an elasticity is — that is article 2,
  and the spine bridge from this article to that one is where the handover
  goes.
- `economic-rent` (live) owns the **frontier and the rectangle test**.
  Different diagram, no reuse.
- The instrument in claim 7 is named and used, not taught. Instrumental
  variables is a Stage 3 econometrics subject with its own article ahead of
  it; here it is one figure and one sentence saying what it would take.

## check-numbers.mjs

15–20 `ok()` blocks. The claim sentences, not only the numbers:

- the base market: `p0 === 20 && q0 === 60`, exact.
- the clearing solver: bisection against the closed-form equilibrium over a
  grid of shock pairs, < 1e-12 — the solver is the independent route for
  everything below, so it is checked first.
- claim 1 and claim 2 **together**, both directions: with `τs = 0` the worst
  distance to the supply curve is < 1e-12 *and* the worst distance to the
  demand curve exceeds 10; with `τd = 0` the same two, swapped. A one-sided
  version of this check is the failure `verifying-an-article.md` describes.
- the slope identity: covariance algebra against `w·S − (1−w)·B` over
  ≥ 200,000 seeded random markets, worst < 1e-12.
- the interval-position form `(b+B)/(S−b) === τd²/τs²` over the same draws,
  relative, worst < 1e-12.
- the bias `b − (−B) === w·(B+S)`, worst < 1e-12.
- the flat point: `w* === B/(B+S)` and a bisection on the closed-form slope
  agreeing to < 1e-12.
- R² at the two ends is `1` with `===`, and `0` at `w*` to < 1e-12.
- **the bracket identity**: `B_hi/B_lo` against `1/R²` over ≥ 100,000 seeded
  random markets restricted to downward-sloping clouds, worst relative
  < 1e-12, with the market count reported in the prose.
- **the bracket contains the truth** in every one of those markets — a
  separate `ok()`, because it is a separate claim, and it is the one that
  would fail first if the algebra were wrong.
- the worked family: each of the five rows reproduces all three moments to
  < 1e-12, asserted row by row.
- the shifter: the noise-free two-point route returns `−B` to < 1e-12, and
  OLS on the same market returns a number of the opposite sign — assert the
  sign, not the value.
- the simulated numbers the prose quotes (the 400,000-draw flat cloud, the
  200,000-draw IV estimate) asserted **to their rounding**, with the draw
  count in the sentence. These are sampling statements and the check says so.

## check-browser.mjs

50–150 assertions at 390px and 1280px, plus the generic half from the
scaffold. The article-specific ones:

- **the geometry assertion.** At the `w = 0` preset, map every scatter
  circle's centre and the demand line's two endpoints through the element's
  own `getScreenCTM()` and assert every perpendicular distance is < 0.5px;
  at the `w = 1` preset assert the same against the *supply* line, and assert
  that at `w = 1` the mean distance to the demand line exceeds 10px. Both
  directions, per the `constrained-choice` precedent — a check that only
  tests the well-behaved half is testing half of nothing.
- sweep the shock-mix slider on its own step grid and assert the fitted
  line's rendered slope changes sign exactly once, at the `w*` preset.
- `BracketFigure`: the bar's rendered length is proportional to the printed
  bracket ratio across three presets, to 1%, and the two readouts (ratio and
  1/R²) print the same three decimals.
- the reverse-regression line is present and distinct from the forward one at
  every preset except `w = 0` and `w = 1`, where they coincide to < 1px.
- give every drawn series its own class — `line fit`, `line reverse`,
  `line demand`, `line supply`, `dot obs` — and select the named one
  (`house-idioms.md`).
- the controls bar sticks above the panels under 700px and is still in the
  viewport after scrolling to the last panel.

## Sources

CORE U8 for the competitive market; the identification problem is Working
(1927) *QJE* 41(2):212–235, and the reverse-regression bounds are Gini
(1921) / Frisch (1934), restated by Leamer (1978) and Klepper & Leamer (1984)
*Econometrica* 52(1):163–183. **Verify all of these before writing the
sentence that leans on them** — the two-regression bracket is standard in the
errors-in-variables literature and the attribution is exactly the kind of
detail that was cut from `smote`. Theirs: the identification problem, the
bounds. Mine: the shock-share parameterisation, the flat-cloud case, the
`1/R²` statement of the bracket width, every number.

## Risks

- **The bracket is an identified set, not a confidence interval.** Say so
  plainly and early. If a reader leaves thinking the width is sampling
  uncertainty, the article has taught the opposite of its own point — and
  claim 7 exists to prevent that, so do not cut it for length.
- **Do not let `CloudLab` grow controls.** One slider (the shock share) and
  three presets. The slopes, the shifter and the bracket live in their own
  figures. This is the mistake `xgboost` is in the reference files for.
- **The reverse regression reads as a mistake if it is not labelled.** A line
  fitted the "wrong way round" needs one sentence of prose the first time it
  appears, in the script block, not in an SVG `<text>`.
- **Four series, three colour slots.** Demand, supply and the fitted line take
  the three; the cloud is `#8a94a2`. The reverse regression is the fitted
  line's colour, dashed — it is the same object fitted the other way, and
  drawing it as a fourth hue both breaks the palette ceiling and says
  something untrue.
- **The simulated cloud must be seeded** from `src/rng.js` and precomputed if
  a fresh draw per frame costs more than a fraction of a second. A cloud that
  resamples while the reader drags the slider makes the fitted line jitter for
  reasons the article is not about.
