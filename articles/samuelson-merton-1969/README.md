# samuelson-merton-1969 (Fr22)

Finance row 51, Stage 8b (the Merton baseline), `finance/portfolios`. Paper
explainer (📄), covering the two companion papers. Built 28 September 2026.
Needs `merton-share` (Fr21).

**Kind:** result (a theorem from two papers). **Shape:** paper explainer:
citation card → the old advice → guess card (thirty years, one year, or the
same) → dynamic programming in words → lab (the backward solution run in the
browser, best share by years to go) → why the horizon drops out (the value
function keeps its shape) → ways out (a floor, returns that revert, a wage in
words) → what came later. **Hook:** `LifetimeLab`.

## Model (ours)

A coin-flip market: stock up 25% or down 11% each year, bond 2% (premium 5,
volatility 18, as in `merton-share`); utility of final wealth only,
(W − F)^(1−γ)/(1 − γ), γ = 2. Floor F = 1. Mean reversion: up-chance 0.4 after
an up year and 0.6 after a down year. Solved backwards over 30 years on a
241-point grid in log(W − F·R^−k), values stored as log((1 − γ)V), shares by
golden-section search.

## Source

Samuelson (1969) and Merton (1969), REStat 51(3), 239–246 and 247–257: the
problem, backward induction, isoelastic utility, the share independent of age
and wealth, consumption along the way, Merton's closed form. Not read in full
on 28 September 2026 (JSTOR); the result and setup are standard and confirmed
from secondary descriptions. Nothing is quoted from either paper.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| The young should hold more stock | Not for an isoelastic investor with iid returns: the backward solution is flat at 84% (one-year closed form) at every horizon and wealth, to 1e-7; a two-year brute force over whole strategies picks 0.835 three times |
| Why | V_k(W) = K_k u(W): each year's problem is the last year's |
| (way out 1) A floor | Bonds for the floor's present value, Samuelson's share for the rest: matches the DP to 1e-4; with twice the floor, 61% at 30 years to go, 43% at one; lines fall as time passes and richer holds more |
| (way out 2) Returns that revert | Myopic shares 145% after a down year, 24% after an up year (closed forms); long-horizon 153% and 31%, a hedging demand of about 8 points in both states, flat after two or three years (one-year memory); wealth still irrelevant |
| (way out 3) A wage | π(1 + H/W), stated and deferred to `human-capital` |

## Checks

24 number checks, including brute force over whole two-year strategies in
both the iid and the reverting market. 60 browser checks, including every
Samuelson line on the dashed line in pixels, the floor lines monotone and
ordered by wealth, and the reverting lines on either side of the dashed line.

## Sources

Samuelson (1969, 1979); Merton (1969, 1971, 1973); Campbell & Viceira (1999);
Bodie, Merton & Samuelson (1992).
