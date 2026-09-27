# `supply-and-demand`

**Kind** model · **Shape** question first, entered through a setup band, turning into an assumption lab · **Hook** `CloudLab` · **Stack** Svelte 5 + Vite

Queue: slate row 3 (Mi3). Builds `src/market.js` (extended from `tax-incidence`) and `src/Components/MarketPanel.svelte`, which `surplus-and-efficiency` imports.

## The angle

A line fitted through market prices and quantities is a weighted average of the demand curve and the supply curve, weighted by which curve was moving. It is neither curve, it can slope upward, and its R² is not a measure of fit — it is exactly the reciprocal of the factor by which the data fails to pin the demand curve down. A cloud with R² = 0.22 leaves the demand elasticity free over a range of 4.6×, and the two ends of that range are the two stories a reader can tell about the same picture.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | You can see the demand curve in market data | **Only when supply is the only thing moving.** With supply-only shocks the solver that reads both curves puts every observation on the demand curve to 1.4e-14 — and the same solver puts demand-only observations more than 40 units away from it. |
| 2 | Then a downward-sloping cloud is a demand curve | **No.** With demand-only shocks the cloud lies exactly on the *supply* curve (1.4e-14) and slopes **up**; the cloud's direction identifies which curve was still, not which curve it is. |
| 3 | — (the mechanism) | The fitted slope is `w·S − (1−w)·B`, a straight line in `w` running from the demand slope at `w = 0` to the supply slope at `w = 1`. Covariance algebra against the convex combination: 2.67e-15 worst over 300,000 random markets. Equivalently the fitted line divides `[−B, S]` in exactly the ratio `τd²/τs²` (2.81e-14 worst). |
| 4 | A flat cloud means quantity does not respond to price | **False, and it is the most misread case.** The cloud is exactly flat at `w* = B/(B+S) = 0.6`, where neither curve is flat and both are steep. Bisection root against closed form: 1.1e-16; 400,000 simulated draws give a slope of 1.0e-3 and an R² of 1.7e-7. |
| 5 | A high R² means the line is trustworthy | **Backwards.** R² = 1 exactly at both ends — where the cloud lies on a curve — and 0 at the flat point. A perfect fit says one curve was still; it never says which. |
| 6 | — (the identity) | The markets consistent with observed moments form a one-parameter family whose demand slope runs from `−Cov/Var(p)` (the forward OLS slope) to `−Var(q)/Cov` (the reverse regression), and **`B_hi/B_lo = 1/R²` exactly**: 4.81e-16 worst relative gap over 199,843 downward-sloping draws in 400,000 random markets, with the truth inside the bracket 199,843 times out of 199,843 (smallest relative slack 3.7e-4). |
| 7 | With enough data the problem goes away | **No — it is not a sample-size problem.** The family reproduces all three second moments to 7.1e-15; more draws sharpen the moments and change the bracket by nothing. A supply shifter recovers the demand slope to 4.4e-15 by a noise-free two-point route, while OLS on the same market returns **+0.787 against a truth of −3** — the wrong sign. |
| 8 | — (cost) | Linear curves, additive independent shocks, one market, no dynamics, and a shifter assumed excluded from demand. The bracket is an identified set under *these* assumptions. |

## Layout

`TwoCurves` (setup band: the two curves, one crossing, a shift button that moves one and walks the crossing along the other) → `TheQuestion` (18 months of market data; drag a line through the cloud, score against both truths) → `CloudLab` (hook: demand-shock share `w` slider, presets `w=0`, `w=0.6`, `w=1`, live fitted line) → `MixFigure` (fitted slope against `w`, straight line from −B to S) → `R2Figure` (R² against `w`: 1 at both ends, 0 at `w*`) → `BracketFigure` (the identity: forward and reverse regressions, admissible demand elasticity bar matching 1/R²) → `ShifterFigure` (supply shifter recovering the demand slope) → limits.

## Sources

CORE U8 for the competitive market; Working (1927) *QJE* 41(2):212–235 for the identification problem; Gini (1921), Frisch (1934), Leamer (1978), and Klepper & Leamer (1984) *Econometrica* 52(1):163–183 for the two-regression bounds.
