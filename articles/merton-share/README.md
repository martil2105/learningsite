# merton-share (Fr21)

Finance row 50, Stage 8b (the Merton baseline), `finance/portfolios`. Concept.
Built 28 September 2026. Needs Mi46 (`risk-aversion`), Mi48
(`portfolio-choice`) and Fr9 (`kelly-criterion`), none built yet, so the
article defines the certainty equivalent, risk aversion and the Kelly share
inline.

**Kind:** concept (with closed forms). **Shape:** lab first (the value of every
share, a parabola, legible cold) → the formula at the peak → the flat top and
its universal shape → which premium goes in → the premium we have to estimate
(two panels: where 200 plug-in shares land, and the fraction kept by years of
data). **Hooks:** `ShareLab`, `EstimateFig`.

## Model

CRRA investor, one stock index and a safe asset, constant share, continuous
rebalancing, iid lognormal returns. Premium 5%, volatility 18%, γ = 2 (slate
numbers). CE − r = π e − γπ²σ²/2 at every horizon.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| π* = (μ − r)/(γσ²) | True: 77% at γ = 2, 154% at γ = 1 (Kelly, leverage), 39% at 4, 19% at 8; found by search on expected utility of terminal wealth at 1 and 30 years |
| (found in probing) The precise share matters | Barely: x times the share keeps 2x − x² = 1 − (1 − x)² of the best gain, whatever the inputs; 100% keeps 91%, half or one-and-a-half keeps 75%, a third off costs a ninth, double keeps nothing |
| Any premium will do | No: typing the log premium (3.4%) gives 52% instead of 77%; the log-premium formula is (m + σ²/2)/(γσ²) |
| (found in probing) The share survives estimation | A plug-in investor with N years keeps 1 − 1/(N·SR²) of the gain on average, free of γ: 87% with a century, 57% with 30 years, nothing at 1/SR² ≈ 13 years; the share's standard error is 1/(γσ√N) = 28 points at N = 100 |

## Checks

48 number checks: the CE formula against expected utility of terminal wealth
by integration (six shares, γ and horizons), the best share by golden-section
search at 1 and 30 years, the kept fraction against 60,000 simulated plug-in
investors at three (N, γ), and the drawn investors. 80 browser checks,
including the dot at the curve's highest pixel across γ and the premium
preset, the premium line as the tangent at zero, and each pink dot exactly
outside the shaded zone at four record lengths.

## Sources

Merton (1969, 1971); Samuelson (1969); Kelly (1956); Kan & Zhou (2007, the
general plug-in cost, which this is the one-asset, known-variance case of).
