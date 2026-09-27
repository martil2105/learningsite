# `efficiency-wages`

**Kind** model · **Shape** lab first · **Hook** `EffortLab` ·
**Stack** Svelte 5 + Vite

CORE spine row 7 (U6). Lifts `constrained-choice`'s tangency geometry.

## The angle

The wage is a property of the effort curve alone: the optimum is where the
elasticity of effort with respect to the wage is exactly 1 (the Solow
condition), labour demand never enters it (the solver reads L and returns
one wage within its own 1.6e-7 search noise across L = 1…1000), and the
queue of willing workers is the collateral behind the dismissal threat, not
a failure to clear.

## The model

`e(w) = 1 − (w_r/w)^a`, w_r = 10. Closed forms `w* = w_r(1+a)^(1/a)`,
`e* = a/(1+a)` — w* = 20, e* = ½, unit cost 4·w_r at a = 1, exact. The
monitoring reading: a worker shirks unless the premium satisfies
R·p·F ≥ g, so `w = w_r(1 + 1/(pF))` — the premium fraction is exactly
1/(pF), monitoring and penalty the same lever on a hyperbola.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | The wage is set by supply and demand | **Demand does not appear** — one wage across L = 1…1000, solver reads L |
| 2 | Firms pay above the clearing wage | True — w* = 2·w_r exactly at a = 1 |
| 3 | — (the condition) | **Identity:** effort elasticity = 1.0000000 at w* (to 1e-7 over 9 parameterisations); the tangency of a ray from the origin |
| 4 | — (closed forms) | w*, e*, unit cost to 1e-9 over w_r ∈ {8,10,12} × a ∈ {1,2,3}; 17.3205081 at a = 2 with effort 2/3 |
| 5 | Better monitoring lets you pay less | **Only the product pF matters** — premium 1/(pF): 2000% at p = 0.05, 500% at 0.2, 100% at p = F = 1 |
| 6 | Perfect monitoring collapses the construction | **Only with an unbounded penalty** — p = 1 with F = 1 still pays 100% |
| 7 | Unemployment is a disequilibrium | **It is the equilibrium** — 60 of 100 employed at the tangency wage; the queue is what the premium buys |
| 8 | — (cost) | One firm, one period, scalar effort; no search feedback. Limits section |

## Layout

`EffortLab` (hook: effort curve, wage + curvature sliders, the ray, cost and
elasticity readouts) → `ElasticityFigure` (three curvatures, three crossings
on 1) → `SizeCheck` (the L-invariance table) → `QueueFigure` (employed vs
queueing) → `MonitorFigure` (premium = 1/(pF)) → limits.

## Verification

- `npm run check` — 11 checks; closed forms against a blind search to 1e-6
  (the search's own noise, stated); the elasticity identity to 1e-7; the
  a = 1 case and the premium table with `===`.
- `verify/check-browser.mjs` — the dot sits on the ray in rendered pixels
  across a wage sweep, the elasticity readout says 1.00 at w = 20, and the
  four L rows render one identical wage string.

## Source

CORE U6. Solow (1979) *J. Macroeconomics* 1(1):79–82; Shapiro & Stiglitz
(1984) *AER* 74(3):433–444; Akerlof & Yellen (1986) — **verify before
citing.** Theirs: the wage as an incentive device. Ours: the effort family,
the L-invariance, the 1/(pF) hyperbola and which limit collapses the
construction, every number.