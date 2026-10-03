# capm-and-beta (Fr5)

Finance row 15, `finance/portfolios`. Built 3 October 2026. Needs Fr4.

**Kind:** model + empirical (the CAPM in a world where it holds, then Kenneth
French's value-weighted beta deciles, July 1963 to August 2026, 202608 CRSP
vintage, pinned in `data/` with hashes in `data/sources.json` and
`data/SOURCES.md`). **Shape:** build-up: a beta is a slope (`BetaScatter`) →
the CAPM's line → a test that flattens the line on its own (`SortLab` in a
CAPM world, the noise in the betas on a slider and the x axis on a toggle) →
the line in US data (`SortLab` on French's deciles) → low beta, high alpha
(`AlphaBars`). **Hook:** `SortLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Beta measures systematic risk, estimated from 60 months of returns | It's a noisy reading: the deciles were sorted at average prior betas of 0.22 to 2.66 and then had 0.59 to 1.60, 41% of the spread |
| The CAPM: expected excess return = β × market premium | In a world where it holds, a line through the sorting betas has slope premium × reliability (3.0 against 7.2 at the US reliability of 0.41, noise 0.54), and a line through the betas the groups then had is the CAPM's line exactly |
| In the data the line is too flat (the low-beta anomaly) | Against the sorting betas, 1.3; against the betas they had, 3.4 against 7.2, crossing zero beta at 4.6%. Fama–MacBeth SE 3.0 (can't reject 7.2 alone); halves 1.2 vs 4.8 and 5.0 vs 9.6. Alphas +2.5% (lowest) and −2.9% (highest); low minus high 5.4% a year, t 2.2, beta −1.0 |

## Numbers on the page

`verify/check-numbers.mjs` (63 checks): data hashes and a fresh parse against
`src/data.js`; raw values read straight from the CSVs; the tenths of a normal
against a million sorted draws; the closed-form world against 400,000
simulated shares; every US number; chart windows. `verify/check-browser.mjs`
(64 at 390 and 1280 px): all 758 months drawn, the drawn fit's slope 1.60, the
world's dots on the CAPM line once the axis switches, the US fit flatter than
the CAPM line at both ends, bars read back to the alphas.

## Data

`scripts/fetch-data.mjs` (downloads and checks hashes), `scripts/build-data.mjs`
(writes `src/data.js`), `scripts/data-lib.mjs` (curl, unzip, French CSV blocks).

## Sources

French Data Library; Sharpe (1964); Lintner (1965); Black, Jensen & Scholes
(1972); Fama & MacBeth (1973); Blume (1975); Roll (1977); Frazzini & Pedersen
(2014).
