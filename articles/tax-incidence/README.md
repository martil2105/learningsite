# `tax-incidence`

**Kind** model · **Shape** assumption lab · **Hook** `WedgeLab` ·
**Stack** Svelte 5 + Vite

CORE spine row 6 (U8). Extends `src/market.js`, first built in
`markup-and-elasticity`; `externalities` imports the same module.

## The angle

Statutory side is theatre: two routes sharing no algebra agree to 2e-14.
The linear share S/(B+S) is exact at every rate; the elasticity-ratio rule
is first-order only; and at the revenue peak, q/q₀ = ½ and DWL/revenue = ½
in every linear market, independent of the elasticities.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | A tax drives a wedge | True — t=5: buyers 22, sellers 17, quantity 54 (exact) |
| 2 | Who writes the cheque is irrelevant | **Exact** — 2.13e-14 worst over 401 rates |
| 3 | εs/(εs+εd) splits the burden | Exact for linear (0.4 at every t); **first-order only** otherwise — iso-elastic εd=1.5, εs=1 drifts 0.4012 → 0.4632 at 50%, same direction in every pair tried |
| 4 | A tax burns a triangle | **½t²·BS/(B+S) exactly** — 15 at t=5; doubling quadruples |
| 5 | Higher rates raise more revenue | Only to t* = q₀(B+S)/(2BS) = 25 (prohibitive tax 33.3) |
| 6 | — (the identity) | At the peak q/q₀ = ½ and DWL/revenue = ½ — exact over **280,000** random linear markets (worst < 1e-9), independent of elasticities |
| 7 | Incidence is statutory design | It is mobility: perfectly inelastic supply bears all (share 0), perfectly inelastic demand bears all (share 1) |
| 8 | — (cost) | Salience, market power (→ pass-through, the markup article), horizons. Limits section |

## Layout

`WedgeLab` (hook: rate slider + statutory toggle; the curve moves, the
outcome does not) → `DriftFigure` (textbook share vs the bisection) →
`LafferFigure` (the parabola, the peak, the two halves, three markets) →
limits.

## Verification

- `npm run check` — 17 checks; invariance to 1e-12 over 401 rates; the
  t=5 arithmetic and the peak ratios with `===`; 280,000 seeded random
  markets; the drift against the bisection at its tolerance.
- `verify/check-browser.mjs` — the statutory toggle moves the shifted
  curve's path while the rendered pc/pp dots and quantity line stay within
  0.5px; every market preset reads 50.0% twice.

## Source

CORE U8. Harberger (1964); Weyl & Fabinger (2013); Chetty, Looney & Kroft
(2009) — **verify before citing.** Theirs: the wedge, the rule. Ours: the
two-route invariance, the drift, the peak identity, every number.