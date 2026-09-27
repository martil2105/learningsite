# `tax-incidence` — pass-1 spec

**Kind** model · **Shape** assumption lab · **Hook** `WedgeLab`
**Stack** Svelte 5 + Vite · **Queue** CORE spine row 6 (U8); builds on
`src/market.js` from `markup-and-elasticity` (extends it, does not fork it)
**Closest analog by shape** none — the assumption lab is new to the project;
`constrained-choice`'s second half is the nearest mechanics.
Planned 16 Sep 2026; re-derive all numbers in pass 1.

## Shape reason
The textbook case the shape menu describes: plant a truth, show it recovered
exactly, then put the identifying assumption on a control and break it. Two
truths here are exact (the statutory side is irrelevant; the linear share is
S/(B+S)) and one degrades visibly as the rate rises, so the mechanism and its
failure are the same object.

## The angle
Who writes the cheque changes nothing, to fourteen decimal places. The
elasticity rule that says who *does* bear it is exact only for an
infinitesimal tax — and at the rate that raises the most money, the tax has
already destroyed half the trades and burned half the revenue.

## The model
Linear market, per-unit tax t: D: `q = A − B·pc`, S: `q = C + S·pp`,
`pc = pp + t`. Base `A=120, B=3, C=20, S=2` → p₀ = 20, q₀ = 60 exactly.
Closed forms: `pp = (A−C−Bt)/(B+S)`, `q = C + S·pp`, consumer share
`= S/(B+S)`, `DWL = ½t²·BS/(B+S)`, `t* = q₀(B+S)/(2BS)` = 25.
An iso-elastic version (both sides constant-elasticity) carries the
degradation.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | A tax drives a wedge: buyers pay more, sellers get less | True — t=5 → pp 17, pc 22, q 54 | `WedgeLab` |
| 2 | Who writes the cheque is irrelevant | **Exactly.** Two independently coded routes (supply shift vs demand shift) disagree by 2.13e-14 worst over 401 rates | `WedgeLab` toggle |
| 3 | The inelastic side bears it: `εs/(εs+εd)` | **Exact for linear at every rate** (0.4 = S/(B+S)); **a first-order approximation otherwise** — iso-elastic εd=1.5, εs=1: 0.4012 at 1%, 0.4122 at 10%, 0.4309 at 25%, 0.4632 at 50%; six parameter pairs drift the same way | `DriftFigure` |
| 4 | A tax burns a triangle | **`½t²·BS/(B+S)` exactly** — 15 at t=5; doubling the rate quadruples the loss | `WedgeLab` |
| 5 | A higher rate raises more revenue | **Only to t\* = 25**, the Laffer peak | `LafferFigure` |
| 6 | — (the identity) | At the peak, `q/q₀ = ½` **and** `DWL/revenue = ½` in every linear market: worst 1e-12 and 2e-12 over 279,871 random ones. Neither depends on the elasticities at all | `LafferFigure` |
| 7 | Incidence is about statutory design | **It is about who cannot move** — a perfectly inelastic side bears 100% at any rate | prose + preset |
| 8 | — (cost) | Linear static curves, no market power, no evasion; with market power incidence is pass-through, which is `markup-and-elasticity`'s subject | limits |

## The identity on screen
`LafferFigure`: revenue against the rate with the peak marked, and beside it
the two halves — the quantity ratio and loss-to-revenue — both reading
exactly 0.500 at that rate, for several markets the reader switches between.

## Layout
`MarketFigure` (the market, no tax) → `WedgeLab` (hook: a rate slider plus a
"who pays the cheque" toggle that visibly moves a curve while nothing about
the outcome moves) → `ShareFigure` (the exact linear share) → `DriftFigure`
(the break: iso-elastic curves, textbook share against exact, error growing
with the rate) → `LafferFigure` (the two halves) → limits.

## check-numbers.mjs
- statutory invariance: two routes, worst gap < 1e-12 over a fine rate grid.
- the linear share, DWL and t* as exact closed forms; the t=5 numbers above.
- the peak ratios over ≥100,000 random linear markets (seeded `rng.js`),
  worst < 1e-9 each, with the market count reported in the prose.
- the iso-elastic drift table at the five rates, tolerances stated as the
  bisection's.

## check-browser.mjs
- flip the statutory toggle and assert the rendered y of both price lines and
  the x of the quantity line are identical to <0.01px while a curve's path
  string changes — the curve moves, the outcome does not.
- sweep the rate and assert the DWL region's rendered area grows
  quadratically (a t² fit to within 0.5%).
- the two-halves readouts say 0.500 at the peak for every preset market.

## Sources
CORE U8. Harberger (1964) on measurement; Weyl & Fabinger (2013) on
pass-through and incidence. **Verify before citing.** Theirs: the wedge, the
elasticity rule. Mine: the two-route invariance, the drift measurement, the
half-and-half identity, every number.

## Risks
- The toggle must move a *curve*, not just relabel — otherwise the reader
  sees a label switch, which proves nothing. The invariance is only
  persuasive when something visibly moves and nothing measurable does.
- Do not let `WedgeLab` carry the elasticities as controls as well: one
  slider (t) and one toggle. Elasticities live in `DriftFigure` and presets.