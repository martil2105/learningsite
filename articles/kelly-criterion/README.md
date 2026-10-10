# kelly-criterion (Fr9)

Finance row 19, `finance/portfolios`. Built 4 October 2026. Needs Fr1.

**Kind:** result (Kelly 1956, Breiman 1961; the first-passage formula is
standard for Brownian motion with drift, as Thorp 2006 uses it). Simulation and
exact binomial sums, no data files. **Shape:** case first (Haghani and Dewey's
60% coin: `CoinLab`, 61 seeded players) → Kelly's rule (`GrowthFigure`: the
typical player's growth against the average's) → from coins to stocks (154%)
→ guess card (Kelly against half Kelly after 30 years) → the race (`RaceLab`,
the hook: 40 pairs and the chance Kelly is ahead) → how far down
(`DrawdownLab`: x^(2/c − 1)) → costs. **Hook:** `RaceLab`.

## Why this angle

`merton-share` already has the Kelly share as Merton's share at γ = 1, and the
flat top 2x − x² (twice Kelly grows no faster than cash), which was the slate's
claim for this row. So this article is about the path: how long Kelly's "long
run" is, and how far down the bet goes on the way.

## The model

Coin: p = 0.6, even money, $25, 300 flips. After k heads in n flips a player
betting f has 25(1 + f)^k(1 − f)^(n−k), so every number is an exact binomial
sum, and "ever touched a level" is a walk on the binomial lattice.

Stocks: premium m = 5% over cash, σ = 18% (as `merton-share`), SR = m/σ,
continuous rebalancing, measured against cash. A position of c × Kelly has log
wealth with drift SR²(2c − c²)/2 and volatility c·SR.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Bet p − q on an even-money coin, m/σ² on stocks | Exact: 20% on the 60% coin, 154% on our stocks |
| Twice Kelly grows no faster than cash | Exact in continuous time; on the coin growth returns to zero at 38.9%, a little under twice |
| Kelly maximises wealth | It maximises the typical (median) outcome, 25·e^(300g) after 300 flips, $10,504 at 20%. The average rises with every extra percent; all in, it is $1.4 × 10²⁵ from one game in 3.6 × 10⁶⁶ |
| In the long run Kelly beats every other fixed bet (Breiman) | True, but slowly: P(Kelly ahead of c × Kelly after T years) = Φ(\|1 − c\|·SR·√T/2). Against half Kelly: 65% at 30 years, 94 years for 75%, 341 for 90%. Time is measured in 1/SR² (13 years). The coin's 300 flips hold SR²n = 12.5, as much as 162 years of stocks, and both give 81% (exact binomial for the coin) |
| Half Kelly: three quarters of the growth, half the volatility | Exact; and P(ever falling to x) = x^(2/c − 1): halving 50% → 12.5%, losing 90% 10% → 0.1%. Full Kelly: the chance of ever falling to x is x. Within 30 years at full Kelly: 42%. All in stocks (0.65 Kelly): 24%. Coin, 300 flips: the Kelly player is cut to $12.50 in 45% of games, half Kelly 10% |

## Numbers on the page

`verify/check-numbers.mjs` (69 checks): the lattice against 200,000 simulated
games; peaks by grid search; the median by sorting every outcome; the race
formula against 40,000 simulated pairs and against 2,000 pairs rebalanced daily
on a normal market; the 30-year first-passage formula against daily steps
(which cross a little less often); every number in the prose, rounded as the
page rounds. `verify/check-browser.mjs` (90 at 390 and 1280 px): the typical
path ends at the middle player and reads $10,504 on the log axis, the $25 and
$250 lines, the Kelly ring on the peak and the zero tick on the crossing, the
26 lines above 1 at 30 years counted from the drawn paths, the dot on the race
curve, the drawdown curve on the diagonal at full Kelly.

## Seeds

`CoinLab` uses seed 116 for its 61 players: at 20% its middle player's final
heads count is 180, so the median is the exact $10,504, and the counts behind,
halved and capped are within one or two of 61 times the exact chances (the
check asserts it). `RaceLab` uses seed 768 for its 40 pairs, within 1.5 of 40
times the race formula at six (rival, year) settings.

## Sources

Kelly (1956); Breiman (1961); Haghani & Dewey (2016, SSRN 2856963: 61 players,
$25, 30 minutes, about 300 flips, $250 cap, 28% bust, 21% at the cap, quoted);
Thorp (2006); MacLean, Thorp & Ziemba (2010); Samuelson (1979).
