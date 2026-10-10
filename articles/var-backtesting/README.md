# var-backtesting (Fr14)

Finance row 24, `finance/portfolios`, Stage 4. Built 9–10 October 2026. Needs
Fr12 (`value-at-risk`); uses the daily market kit of Fr10/Fr11/Fr13.

**Kind:** concept + empirical. The binomial half is exact; the data half runs
four 99% VaR models over French's daily file (202608 vintage, pinned in
`data/`, the same file as `volatility-clustering`).

**Shape:** question first (a model that's really a 98% VaR: how often is it
green?) → the count lab (`ZoneLab`, the hook: the 250-day count for a model's
true rate, over the three zones, with the right model in grey) → Kupiec's test
→ how many days it takes (`DaysFigure`: power against days on a log axis) →
a century of US days (`CenturyLab`: four models, 104 blocks of 250 days, one
block's days with the VaR line) → bunching (`ShuffleFigure`: the same
exceptions as they happened and shuffled; block counts against the binomial;
the variance identity and the day after an exception) → what the rules do →
costs. **Hook:** `ZoneLab`.

**Angle:** a year of 99% exceptions is a count of about 2.5 rare events, so it
can barely tell a right model from one that's twice too optimistic, and it
can't see *when* the exceptions came.

## The model

An exception is a day whose loss (−r, the market's total daily return) beats
the VaR reported the evening before. A right model makes each day an exception
with probability 1%, whatever came before, so a 250-day count is
Binomial(250, 1%). Zones: green while P(K ≤ k) ≤ 95% (0–4), red once it
passes 99.99% (10+), yellow between (5–9); plus factors 0.40, 0.50, 0.65,
0.75, 0.85, 1 on the multiplier of 3 (Basel 1996; same zones under FRTB with
multipliers 1.5 to 2).

Tested days: the last 104 blocks of 250 trading days, 23 July 1927 to
31 August 2026 (26,000 days). Models (each quantile is the smallest l with
P(L ≤ l) ≥ 99%, as in `value-at-risk`):

- **knows the century**: the 99% loss of the 26,000 tested days (3.09%).
- **last 250 days**: historical simulation, the 3rd-largest loss of the
  previous 250 days.
- **RiskMetrics**: 2.326 × an EWMA volatility (λ = 0.94, from returns up to
  the day before; seeded with day 0's square).
- **filtered history**: that volatility × the 99% quantile of the last
  (up to) 1,000 days' losses, each divided by its own day's volatility.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| A 99% VaR should have about 2.5 exceptions a year, and the traffic light catches bad models | A right model is green 89.2%, yellow 10.8%, red 0.03% of years. A model whose VaR is really the 98% loss is still green 43.9% of years (yellow 53.1, red 3.0). The average multiplier is 3.05 against 3.32, 9% more capital. The zone edges are the binomial's 95% and 99.99% points |
| Kupiec's test is the formal check | At 250 days it accepts 1 to 6 exceptions, rejects zero (LR 5.03 > 3.84, too cautious) and rejects the 2% model in 24% of years |
| More data fixes it | One-sided test at 5%: the power against 2% stays above 80% only from 1,015 days (about four years), 1.5% from 3,295 (about 13), 3% from 340. The normal approximation (792, 2,829, 236) shows the scaling: half the gap, four times the days. The curves are jagged because the count is whole |
| A model with the right number of exceptions passes | Knowing the century's 1% loss gives exactly 260 exceptions in 26,000 days, and 8 red blocks, 10 yellow, 49 with none (a right model: 0.03 red, 11.2 yellow, 8.4 with none). The variance of a block's count is about 10× the binomial's: 1 + 2Σ(1 − k/250)ρ_k = 10.3 from the autocorrelations, 10.4 from every 250-day window. After an exception, the next day is one 9.6% of the time |
| The industry's models fix this | Last 250 days: 1.46% (379), 3 red, 30 yellow, 9.2% after an exception, factor 2.0. RiskMetrics: 2.13% (555), 9 red, 51 yellow, 5.6%, factor 1.35. Filtered history: 1.07% (279), no red, 15 yellow, 4.3%, factor 1.0 (still fails Christoffersen's test, LR 15.9) |
| Bunching is about when, not how many | Shuffling the century model's exceptions (seeds 1–5) leaves 260 of them and gives no red blocks, 7–11 yellow, 2–10 with none and about 1% after an exception |

## Numbers on the page

`verify/check-numbers.mjs` re-derives every number from `src/backtest.js`
and the pinned file, rebuilds `src/data.js` from `data/` and compares, checks
the binomial against a simulation of seeded right models, the sliding
quantiles against a brute-force sort, the variance identity both ways, and the
shuffle seeds. `verify/check-browser.mjs` reads the lab's bars back through
the axes, the power curves' crossings, the block bars against the readouts,
the VaR line against the exception dots, and the shuffle.
