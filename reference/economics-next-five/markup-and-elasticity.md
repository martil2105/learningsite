# `markup-and-elasticity` — pass-1 spec

**Kind** concept · **Shape** comparison spine · **Hook** `CurvatureLab`
**Stack** Svelte 5 + Vite · **Queue** CORE spine row 5 (U7)
**Closest analog by shape** none — the spine is new to the project; the
nearest mechanics are `dbscan-hdbscan`'s two-object build-up.
Planned 16 Sep 2026; re-derive all numbers in pass 1.

## Shape reason
The article *is* two demand curves that agree on everything the received rule
mentions and disagree on everything that matters. `choosing-the-shape.md`:
for genuinely comparative subjects the spine beats a second panel bolted onto
a lab, and no article has used it yet — say that in the shape-table row.

## The angle
`markup = 1/|ε|` is exactly true, and it is a statement about a single point.
Two demand curves through the same point with the same elasticity set the
same price to the last digit — and one passes half a cost increase through
while the other passes two and a half times.

## The model
One family, `q(p) = (a + b·p)^n`, every member pinned through p₀ = 25,
q₀ = 45 with local elasticity ε₀ = 5/3: linear is n = 1 (A = 120, B = 3),
iso-elastic is n = −ε (K = 45·25^(5/3)). Pass-through `ρ = n/(1+n)`, exact.
The first-order condition is `(p−c)·q′ + q = 0`; differentiating it in c
gives `ρ = q′/(2q′ + (p−c)·q″)` — curvature enters, elasticity does not.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | A firm with market power prices above marginal cost | True; the gap is the subject | `TwoDemands` |
| 2 | markup = 1/\|ε\| | **True, exactly** — at c = 8, 9, 10, 11, 12, both curves' Lerner equals 1/ε to 6 dp | `LernerCheck` |
| 3 | So elasticity tells you the price | **Only at the point you measured.** Both give p* = 25 and Lerner 0.6 at c = 10; at c = 12 one gives 26, the other 30 | `CostShock` |
| 4 | Firms absorb part of a cost increase | **False in general.** ρ = n/(1+n): exactly 1/2 for linear; ε/(ε−1) > 1 for iso-elastic — 3.0 at ε=1.5, 2.0 at 2, 1.5 at 3, 1.25 at 5 | `PassThroughFigure` |
| 5 | — (the identity) | `ρ = n/(1+n)`; the numeric derivative of an independently optimised price agrees to ~1e-6; the markup itself is invariant to n to machine precision | `CurvatureLab` |
| 6 | — (why) | Pass-through reads `q″`; the elasticity does not contain it | `WhyFigure` |
| 7 | More elastic demand is more competitive | **For the level, yes; for the response, no** — sign and size of the cost response are set by curvature, independently of ε | prose |
| 8 | — (cost to a practitioner) | Every measured elasticity funds a counterfactual: a cost shock, an input price, a tax. Limits: calibrate pass-through directly | limits |

## The identity on screen
`CurvatureLab`: one slider, n. Every curve stays pinned through the same
point with the same slope, the monopoly-price readout never moves, and the
pass-through readout runs from 0.5 to 3.

## Layout
Two curves side by side the whole way down:
`TwoDemands` (they agree) → `OptimumSpine` (same MR = MC, same price) →
`LernerCheck` (same markup, a live table) → `CostShock` (cost slider; the
prices separate) → `CurvatureLab` (hook: the family collapses both into one
n) → `PassThroughFigure` (`ρ = n/(1+n)` over a wide range) → `WhyFigure`
(the curvature term) → limits.

## check-numbers.mjs
- closed-form p* and ρ against a golden-section optimiser that never sees the
  formulas (the `nash-equilibrium` two-routes pattern), n ∈ {1, −1.5, −2, −3,
  −5} × c ∈ {8,…,12}: p* to 1e-6, ρ to 1e-4.
- pinned-point invariants: q(25) = 45 and B·25/q = 5/3 for every n, exact.
- markup invariance: |Lerner(n) − 0.6| < 1e-12 across the sweep.
- the iso-elastic over-shift values 3.0 / 2.0 / 1.5 / 1.25.

## check-browser.mjs
- with the cost slider at its base, the two rendered price lines are within
  0.5px; at the top of the range they are more than 10px apart.
- sweep n across 25 positions: the markup readout is unchanged; the
  pass-through readout is monotone.

## Sources
CORE U7. Lerner (1934) *RES* 1(3):157–175; Bulow & Pfleiderer (1983) *JPE*
91(1):182–185 (the constant-pass-through family); Weyl & Fabinger (2013)
*JPE* 121(3):528–583. **Verify all three before writing the sentences.**
Theirs: the received rule, the pass-through literature. Mine: the pinned
family as one object, every number, the ρ-versus-markup independence
measurement, the 26-versus-30 figure.

## Risks
- Keep the two-panel spine on one fixed price axis (`house-idioms.md`: panels
  compared by their slopes share one scale), or the "they agree" step dies.
- If `CurvatureLab` grows past one slider, split the parameter onto a figure;
  the xgboost ten-control mistake is the warning.