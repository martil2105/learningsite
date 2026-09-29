# index-construction (Fm4)

Finance row 5, `finance/markets`. Built 30 September 2026.

**Kind:** result (an exact identity) + model (a simulated market, with a
switch for whether big firms slow down).
**Shape:** build-up. Three stocks and one month (`DriftFigure`: the cap-weighted
index needs no trade, the equal-weighted one sells its winner) → how much the
equal-weighted index trades, and what it gains, by rebalancing frequency
(`TurnoverChart`, two panels sharing a log axis) → the identity → the lab
(`IndexLab`: thirty years, a dollar in each index above, the gap split into its
two parts below) → when big firms slow down. **Hook:** `IndexLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Slate: a cap-weighted index never needs rebalancing | True for price moves (its weights are the market-value shares of a fund that never traded, asserted to 1e-12); it trades on membership changes and share issues, handled through the divisor |
| Slate: an equal-weighted index is a contrarian strategy that trades every day | Contrarian yes (it sells what rose). "Every day" only if it rebalances daily, which buys nothing: turnover a year ≈ σ√(f/2π) (12% / 24% / 41% / 189% yearly / quarterly / monthly / daily at 30% stock-specific volatility), while the gain ≈ σ²/2 = 4.5% a year at every frequency |
| (implied) Equal weight beats cap weight by the rebalancing gain | Not by itself. Exactly, ln(EW/CW) = Σ ln(AM/GM) + ln(w̄_T/w̄_0) (Fernholz's idea, discrete version, asserted to 1e-12 against two funds of real holdings and for arbitrary returns). When every stock has the same prospects the concentration term takes back about 97% of the gain on average over 1,000 markets (gain 1.34 over 30 years, gap centred near zero, about 0.25 either way). When big firms slow down (a pull towards the average size), concentration settles and the equal-weighted index keeps most of the gain (+0.89 in the first market), because the cap-weighted index falls behind |

## Numbers on the page

`verify/check-numbers.mjs` (50 checks). First market: seed 15, 100 stocks,
30 years monthly: $9.92 and $9.30, gain 1.33, concentration −1.27, gap 0.06,
18.8 effective stocks. With the pull (κ = 0.05): 0.89, $9.93 and $4.07, 48.9
effective stocks.

## Sources

Fernholz (2002), Fernholz & Shay (1982), Booth & Fama (1992), S&P Dow Jones
Indices' Index Mathematics Methodology.
