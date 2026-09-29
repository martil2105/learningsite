# anarkulova-cederburg-odoherty-2022 (Fr20)

Finance row 49, Stage 8a, `finance/portfolios`. Paper explainer (📄📊). Built
28 September 2026. Needs `time-diversification` (Fr16); Fr7 (`equity-premium`)
is not built.

**Kind:** result (a paper's empirical claim, rebuilt on simulated markets).
**Shape:** paper explainer: citation card → the survivor problem → lab (39
identical markets, the luckiest in blue, loss chance by horizon from each
record) → the luck premium and its z-shift → figure (truth against the
luckiest record, choose n and Y) → what the paper found (quoted) → what came
later. **Hooks:** `MarketsLab`, `LuckFig`.

## Data

The paper's data (Global Financial Data plus hand collection) are not public,
and no open multi-country panel (JST Macrohistory, DMS) was reachable from the
build container or the Mac on 28 September 2026. As the slate allows for 📄📊
rows, the article rebuilds the mechanism on simulated markets and quotes the
paper's real-data numbers as theirs, so it has no `data/` folder.

## Source

Anarkulova, Cederburg & O'Doherty (2022), JFE 143(1), 409–433: published
abstract (39 countries, 1841–2019, 12% at 30 years). The 2021 working-paper
version (38 countries, 1890–2019) for: stationary bootstrap with 120-month
mean blocks wrapping to a random country; Table III (domestic stocks 42.7% one
month, 18.5% five years, 15.2% ten, 13.8% twenty, 12.6% thirty; international
stocks 4.1%, bonds 26.8%, bills 36.9% at thirty); Table V (US alone 1.2%).
Jorion & Goetzmann (1999) abstract (US 4.3% real vs 0.8% median of 39
markets, 1921–1996). The 2023 lifecycle paper: a published summary of its
abstract.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| The US record shows 30-year real losses are rare | True of the record; in a world of 39 identical markets (4% log growth, 20% volatility, 130 years) the richest market's record implies 2.3% (lab world) and typically 1.7% against a truth of 13.7%, a factor of about eight, from luck alone |
| Pooling the records fixes it | In our identical world, pooled records land on the truth (median 13.7%) |
| (found in probing) How far off the survivor is | Growth overstated by E[max_n]·σ/√Y (2.15 × 1.75 = 3.8 points); inside Φ that is a z-shift of E[max_n]·√(T/Y), independent of the growth rate and the volatility: 1.03 sd at 30 years |
| More markets or longer records change it a lot | Slowly: 100 markets 4.4 points, 180 years 3.2 points |
| (quoted) The paper's numbers | 12% (published), US alone about 1%, 15% at ten years → 13% at thirty, foreign stocks about 4%, bonds and bills about 27% and 37% |

## Checks

26 number checks: the lab's world; 3,000 simulated worlds with an independent
generator (luck premium, median survivor loss chance, pooled median, factor of
eight); E[max_39] against 200,000 brute-force maxima. 80 browser checks,
including the blue line ending highest among 39 across three worlds, the dot
on its curve, the survivor's curve under the truth at every horizon, and the
two curves meeting at one market.

## Sources

Anarkulova, Cederburg & O'Doherty (2022, 2023); Jorion & Goetzmann (1999);
Politis & Romano (1994).
