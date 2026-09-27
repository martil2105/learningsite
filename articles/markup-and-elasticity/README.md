# `markup-and-elasticity`

**Kind** concept · **Shape** comparison spine · **Hook** `CurvatureLab` ·
**Stack** Svelte 5 + Vite

CORE spine row 5 (`subject-queue.md`, U7). First article on `src/market.js`'s
elder sibling: this one builds `src/demand.js`, which `tax-incidence` and
`externalities` build on.

## The angle

markup = 1/|ε| is exactly true — it is the first-order condition in disguise —
and it is a statement about one point. Two demand curves pinned through
(25, 45) with ε = 5/3 there set the same price to the last decimal, and one
passes half a cost increase through while the other passes 2.5×.

## The model

One family, `q(p) = (a + b·p)^n`, pinned at p₀ = 25, q₀ = 45 with ε₀ = 5/3:
u = q₀^(1/n), b = −sign(n)·ε₀·u/(|n|·25), a = u − b·25. Closed forms for the
whole family: p* = (n·c − a/b)/(n+1) and ρ = dp*/dc = n/(1+n).

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | A firm with market power prices above marginal cost | True — the gap is the subject |
| 2 | markup = 1/\|ε\| | **True, exactly**, both curves, c = 8…12; Lerner and 1/ε agree to 1e-12 |
| 3 | So elasticity tells you the price | **Only at the measured point.** Both give p* = 25 at c = 10; at c = 12, 26 vs 30 |
| 4 | Firms absorb part of a cost rise | **False in general.** ρ = n/(1+n): 1/2 exactly for linear; ε/(ε−1) > 1 for CES (3.0/2.0/1.5/1.25 at ε = 1.5/2/3/5) |
| 5 | — (the identity) | ρ from the blind search route agrees to 5e-3; the markup is invariant to n to 1e-9 |
| 6 | — (why) | ρ = q′/(2q′ + (p−c)q″) reads off the curve — curvature, which the elasticity does not contain (checked numerically to 1e-3) |
| 7 | More elastic is more competitive | Level yes, response no; the perverse pocket −1 < n < 0 has ρ < 0 |
| 8 | — (cost) | Residual vs market elasticity; local vs response. Limits section |

## Layout

`Spine` (two curves, the pin, the cost slider: agree → split) → `LernerCheck`
(the rule on every row, both curves) → `CurvatureLab` (hook: n slider, pin
still, readouts) → `PassThroughFigure` (ρ = n/(1+n), the perverse pocket) →
limits.

## Verification

- `npm run check` — 17 checks; closed forms vs a blind golden-section search
  (p* to 1e-6), pinned-point invariants exact, the Lerner identity to 1e-12.
- `verify/check-browser.mjs` — the two optima coincide (<1px) at c = 10 and
  split (>20px) at c = 12, and the pin sits still across the n sweep.

## Source

CORE U7. Lerner (1934) *RES* 1(3):157–175; Bulow & Pfleiderer (1983) *JPE*
91(1):182–185; Weyl & Fabinger (2013) *JPE* 121(3):528–583 — **verify before
citing.** Theirs: the rule, the pass-through literature. Ours: the pinned
family, the 26-vs-30 figure, every number.