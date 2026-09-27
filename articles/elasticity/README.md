# `elasticity`

**Kind** concept · **Shape** lab first · **Hook** `RulerLab` · **Stack** Svelte 5 + Vite

Queue: slate row 4 (Mi4). Builds `src/demand.js` with the pinned 5-family demand curves, tangent ruler, arc and log formulas, and revenue helpers.

## The angle

"Elastic" and "inelastic" are not properties of a good. On a single straight demand line, elasticity runs from 0 to ∞ and takes every value in between, so the same good is both, at different prices, on the same curve. What the number actually is, is a **ratio of two lengths**: the point cuts its own tangent line into two pieces, and the elasticity is the upper piece over the lower one — on every demand curve ever drawn, not only straight ones. And the two formulas everyone is taught for computing it from two observations are each exactly right for exactly one demand curve, which is the curve they silently assume.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | Elasticity is the slope, made unit-free | **Half right, and the half that is wrong is the interesting half.** Re-express price in cents and quantity in grams and the slope changes by 10× while elasticity is bit-for-bit identical (`===`) — but slope is constant along a straight line while elasticity is not. |
| 2 | Some goods are elastic and some are inelastic | **Not a property of a good.** On the straight line through (25, 45): \|ε\| = 0.087 at p = 5 and 24.0 at p = 60 — a factor of 276 on one curve. Inelastic on the lower half of its price range, elastic on the upper half. |
| 3 | — (straight-line closed form) | \|ε\| = p/(P_max − p), and equivalently (q_max − q)/q: 7.58e-13 worst relative gap over 20,000 prices. Unit elasticity sits at the midpoint of *both* axes. |
| 4 | — (**the identity**) | \|ε\| = upper tangent segment ÷ lower tangent segment, on **every** curve: worst relative gap 4.5e-15 across all five families, 3,000 points each (lin 4.55e-15, ces 4.16e-16, exp 2.58e-15, quad 3.83e-15, logit 4.51e-15). |
| 5 | Revenue peaks where \|ε\| = 1 | **True, and not only for straight lines**, because d ln R / d ln p = 1 − \|ε\| identically: central difference tracks closed form to 6.7e-11 (ces), 3.4e-10 (exp), 4.7e-10 (logit). Golden-section peaks: lin 31.25, exp 20.0, quad 26.67, logit 27.18, each with \|ε\| = 1 to 4e-8 (flat-maximum floor). Constant-elasticity curve has \|ε\| = 1.6 everywhere and no peak at all. |
| 6 | Compute it from two observations with the midpoint formula | **That formula is exactly the point elasticity at the midpoint price — but only on a straight line**, where it is exact at *any* gap: 1.9e-14 worst over 20,000 random pairs. |
| 7 | — (the hidden assumption) | On a straight line the mean of the two quantities **is** the quantity at the mean price (7.1e-15 worst). On the constant-elasticity curve they are 0.52% apart at 10% price gap, 14.2% at 50%, and 77.7% at 100%. |
| 8 | — (the mirror) | The log-difference formula is exact on the constant-elasticity curve at any gap (2.4e-11) and wrong on the line. Choosing a formula **is** choosing a demand curve. |
| 9 | — (the spread) | Two observations, (20, 57) and (30, 33), give four defensible answers: 0.842 from point 1, 2.182 from point 2, 1.333 from midpoint formula, 1.348 from log difference — a spread of 2.59×. Midpoint answer is the straight line at p = 25; log answer is the constant-elasticity curve. |
| 10 | — (cost) | Own-price only, static, no income effects. |

## Layout

`RulerLab` (hook: curve family selector, draggable point, tangent line, two segments with weights/lengths, ratio readout) → `AlongTheLine` (small-multiple strip of 6 prices on straight line with revenue rectangles) → `RevenueFigure` (revenue vs price with peak marker where \|ε\| = 1, log-log derivative crossing 0; CES option showing no peak) → `TwoPointsFigure` (two points giving 4 answers, toggling line and CES) → `FormulaFigure` (drift chart showing midpoint and log formula errors vs price gap) → limits.

## Sources

CORE U7.5 for definition; Marshall (1890) *Principles of Economics*, Book III ch. iv and Mathematical Appendix, for point-elasticity and tangent-segment construction.
