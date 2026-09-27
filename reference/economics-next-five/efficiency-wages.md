# `efficiency-wages` — pass-1 spec

**Kind** model · **Shape** lab first · **Hook** `EffortLab`
**Stack** Svelte 5 + Vite · **Queue** CORE spine row 7 (U6); lifts
`constrained-choice`'s tangency panel
**Closest analog by shape** `smote`, `autoencoders` (the lab-first pair).
Planned 16 Sep 2026; re-derive all numbers in pass 1.

## Shape reason
The object is one curve with a ray from the origin, legible cold with two
labels — the lab-first test. The reader finds the cheapest wage per unit of
effort by dragging, and only then learns they have found a tangency whose
elasticity is exactly 1. Everything after is an examination of that object.
**Name the hook `EffortLab`, not `WageLab`** — `constrained-choice` already
has a `WageLab`, and hooks are named for the subject.

## The angle
The wage here is not where two curves cross. It is a property of the effort
curve alone — labour demand never enters it, so wanting one worker or a
thousand gives the same wage to eight decimal places, and the workers left
queueing are an equilibrium feature, not a friction.

## The model
`e(w) = 1 − (w_r/w)^a` — effort rises with the wage, `w_r` the reservation
wage, `a` a control with a ≥ 1. Base `w_r = 10`, `a = 1`: `w* = 2·w_r` and
`e* = 1/2` **exactly**. Closed forms `w* = w_r(1+a)^{1/a}`,
`e* = a/(1+a)`, unit cost `w*/e* = w_r(1+a)^{1+1/a}/a` (4·w_r at a = 1).
Monitoring version (the Shapiro–Stiglitz reading): a worker shirks unless the
premium R = w − w_r satisfies `R·p·F ≥ g`; with g = w_r the wage is
`w = w_r(1 + 1/(pF))` — the premium fraction is exactly `1/(pF)`.

## Claims and verdicts (measured at plan time)

| # | Received claim | Verdict | Carried by |
|---|---|---|---|
| 1 | The wage is set by the supply of and demand for labour | **Demand does not appear in it.** w* identical to 8 dp at L = 1, 10, 1000, computed by a route that reads L | `SizeCheck` |
| 2 | Firms pay above the clearing wage to make the job worth keeping | True — w* = 2·w_r exactly at a = 1, a 100% premium | `EffortLab` |
| 3 | — (the condition) | **Identity.** The elasticity of effort with respect to the wage is exactly 1 at the optimum: 1.0000000 to 1e-8 over 9 parameterisations. It is the tangency of a ray from the origin | `ElasticityFigure` |
| 4 | — (the closed forms) | `w*`, `e*` and unit cost, verified to 8 dp over w_r ∈ {8,10,12} × a ∈ {1,2,3}; w_r=10, a=2 → 17.3205081 with effort 2/3 | `WhyTangency` |
| 5 | Better monitoring lets you pay less | **Only the product matters.** Premium = 1/(pF) exactly: 2000% at p=0.05, 500% at 0.2, 100% at p=F=1. Monitoring and the penalty are perfect substitutes on a hyperbola — the same trade `nash-equilibrium` found; say so, and say what differs (here the premium is a wage, there it was an audit rate) | `MonitorFigure` |
| 6 | Perfect monitoring collapses the construction | **Only with an unbounded penalty.** At p = 1 with a bounded F the premium is still 100%. Say precisely which limit is taken | `MonitorFigure` |
| 7 | Unemployment is a disequilibrium | **It is the equilibrium.** At w* the queue of willing workers does not clear, and nothing in the firm's problem wants it to | `QueueFigure` |
| 8 | — (cost) | One firm, one period, effort a scalar; measured effort responses are far smaller than this curve implies | limits |

## The identity on screen
`ElasticityFigure`: the effort elasticity against the wage, crossing 1
exactly where cost-per-effort bottoms out, for three values of a, with the
crossings landing on the closed forms.

## Layout
`EffortLab` (hook: effort curve, draggable wage, ray from the origin,
cost-per-effort readout, elasticity readout) → `WhyTangency` (prose + the
ray + the maths) → `ElasticityFigure` → `SizeCheck` (live table: L = 1 / 10 /
1000, one wage) → `QueueFigure` (labour supply beside the wage; the
unemployed are the gap) → `MonitorFigure` (premium = 1/(pF), with the
nash-equilibrium echo named) → limits.

## check-numbers.mjs
- closed forms against a golden-section minimiser that never sees them, over
  the 9 parameterisations: w* to 1e-6, elasticity at the optimum to 1e-7.
- L-invariance: |w*(L) − w*(1)| < 1e-8 for L ∈ {1, 10, 100, 1000}, the
  solver taking L as an argument (the oracle rule).
- the premium table 1/(pF) at six (p, F) pairs, exact.
- the a=1 case asserted with `===`: w* = 20, e* = 0.5, unit cost 40.

## check-browser.mjs
- drag the wage handle to the minimum: the rendered ray and curve are within
  0.5px at the touch point and diverge by more than 10px either side.
- the elasticity readout says 1.000 at the optimum and moves away
  monotonically.
- `SizeCheck`: the three L rows render one identical wage string.

## Sources
CORE U6. Solow (1979) *J. Macroeconomics* 1(1):79–82 (the elasticity
condition); Shapiro & Stiglitz (1984) *AER* 74(3):433–444; Akerlof & Yellen
(1986) on the fair-wage reading. **Verify all three before writing the
sentences.** Theirs: the wage as an incentive device, the no-shirking
condition. Mine: the effort family, every number, the elasticity-equals-1
measurement, the L-invariance, the 1/(pF) hyperbola and which limit collapses
the construction.

## Risks
- The tangency panel is `constrained-choice`'s object rotated: lift it, keep
  the axis and parameter names recognisable, and tell the reader in one
  sentence that they have met this diagram before — not a reprise.
- The monitoring hyperbola risks reading as a re-run of `nash-equilibrium`.
  The difference is the point: there the penalty bought *less monitoring*;
  here monitoring and penalty are the *same* lever. One paragraph of
  contrast, then move on.