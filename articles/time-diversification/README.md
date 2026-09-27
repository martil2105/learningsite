# time-diversification (Fr16)

Finance row 45, Stage 8a (leverage over a lifetime), `finance/portfolios`.
Built 27 September 2026 on the Svelte 5 scaffold. Needs `volatility-drag` (Fr1)
and `diversification` (Fr3).

**Kind:** concept (with closed forms). **Shape:** lab first, one simulation on two
rulers (yearly average vs money at the end) → two panels sharing the horizon
axis (odds and depth) → the parabola identity with a bar chart of how long each
tail keeps sinking → the fair case (the average shortfall's hump).
**Hook:** `HorizonLab`.

## Model

Stocks ÷ bonds, ln R_T ~ N(mT, σ²T) with m = premium − σ²/2. Defaults: premium
6%, σ = 20%, so m = 4%. 200 seeded yearly paths over 40 years (seed 11).

## Received account and verdicts

| Claim | Verdict |
|---|---|
| The chance that stocks trail bonds falls with the horizon | True: 42% at 1 year, 26% at 10, 14% at 30; monotone to 60 years |
| Risk shrinks like σ/√T | True of the yearly average only; the spread of (log) money grows like σ√T |
| The longer we hold, the smaller the loss when it goes wrong | False: the average shortfall when behind rises 13% → 29% → 37% (1/10/30 years), monotone at 15/20/25% volatility |
| The worst case improves with time | False for decades: the q-quantile of ln R is mT + zσ√T, a parabola in √T bottoming at T* = (zσ/2m)², ratio exp(−z²σ²/4m). 1 in 20: 17 years, 49% behind. 1 in 100: 34 years, 74% behind. At a 4% premium the 1-in-20 wait is about 68 years (halving m quadruples it) |
| (fair case) Expected shortfall | Hump: 5.5% at 1 year, peak about 7.8% near 7 years, 5.1% at 30. It equals chance × depth |

The identity (T*) is the one the plan didn't contain; it became the third figure.

## Numbers on the page

All in `verify/check-numbers.mjs` (61 checks): closed forms against Simpson
integration and bisected quantiles, a 200,000-path simulation with its own
generator, the drawn paths (28 of 200 behind at 30 years on both rulers).
Browser checks (80 across two viewports) include the white circle at the pink
line's lowest point in pixels, the count of drawn paths below the level line at
the horizon marker, the es-peak circle at the dashed line's maximum, and the
log-scale bar ratio.

## Sources

Samuelson (1963, 1969); Bodie (1995); Pástor & Stambaugh (2012); Siegel (1994).
