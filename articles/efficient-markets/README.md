# efficient-markets (Fr10)

Finance row 20, `finance/portfolios`. Built 4 October 2026. Needs Fr4.

**Kind:** model + empirical. French's daily market file (202608 vintage),
pinned in `data/` with its sha256 (see `data/SOURCES.md`), and two simulated
markets that are efficient by construction. **Shape:** case first (a rule
that held the market after up days earned 30.5% a year on paper in 1962–86,
0.3% since 2000) → a century of five-year windows (`HistoryBars`: lag-1
autocorrelation, or the rule on paper) → the random walk and the variance
ratio (identity) → the US variance ratio by period (`VRFigure`) → two
efficient markets that fail the test (`WorldLab`, the hook: stale prices and
the bid–ask bounce) → the profit that isn't there (`ProfitFigure`) → back to
the real data (Ahn et al. 2002) → costs. **Hook:** `WorldLab`.

## Why this angle

The slate's line was "the variance-ratio test, and why returns you can predict
are not the same as profits". `sharpe-ratio` already turns autocorrelation into
a variance ratio for √12, and `pastor-stambaugh-2012` covers predictability
over years, so this article takes the short end: daily predictability that is
real in the recorded prices and absent from any price anyone could trade at.

## The models

True value: a random walk in logs, daily mean 0.04%, volatility 1%.
Stale prices (large index, a share π of stocks idle each day):
o_t = π o_{t−1} + (1 − π) f_t, so ρ_k = π^k (the appraisal-smoothing
recursion of `sharpe-ratio`). Bid–ask bounce: ln p = ln v + (s/2)d,
d = ±1 independent, so Cov(Δp_t, Δp_{t+1}) = −s²/4 (Roll 1984) and
ρ_1 = −(s²/4)/(σ² + s²/2). VR(q) = 1 + 2Σ(1 − k/q)ρ_k in both.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| An efficient market's prices follow a random walk, so VR(q) = 1 | The true value's do. Recorded prices needn't: stale prices give VR(21) = 1.80 at π = 0.3, the bounce 0.68 at a 1% spread |
| The US market rejects the random walk (Lo and MacKinlay) | Yes: VR(21) = 1.58 in 1962–86, 9.1 standard errors (6.5 allowing for changing volatility); 0.78 since 2000 (3.5, but only 1.7 robust). Lag-1 autocorrelation 0.33 in 1967–71, around zero or below since 2002 |
| Predictable returns mean profits | Not when the predictability is in the recording. The rule earns 31% (stale) and 30% (bounce) a year on paper, about 5% for real before costs (the market's return on the half of days it's in), and the bounce rule loses about 48% a year after paying the spread |
| The 1960s–70s autocorrelation was a trading opportunity | Index futures show almost none where the index shows plenty (Ahn et al. 2002, quoted), so most of it was recording |

## Numbers on the page

`verify/check-numbers.mjs` (69 checks): the hash of the pinned file, a fresh
`build-data` run equal to `src/data.js`, an independent float parse of the CSV;
the rule by a second loop; the VR identity against a direct double sum of
autocovariances; the standard error against 400 simulated random walks; the
worlds' autocorrelations, VR and Roll's spread against 400 simulated years; the
rule's closed forms against 400 simulated years; the seeded 25-year runs in the
figures asserted representative; the robust z-scores and the 2017–21 window
without spring 2020. `verify/check-browser.mjs` (84 at 390 and 1280 px): bar
heights read back through the axis, bands, market ticks, the VR dots and band,
the lab's formula curve and its sample dot, the coincident lines at π = 0, the
profit lines' end values on the log axis and the bounce line leaving the chart.

## Seeds

`WorldLab` and `ProfitFigure` share seeds 72 (stale) and 226 (bounce), chosen
so their 25 years land near the formulas at the default settings.
