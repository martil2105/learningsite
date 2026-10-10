# credit-spread-puzzle (Fm15 📊)

Finance row 30, `finance/markets`, Stage 5. Built 10 October 2026. Needs Fm14
(`merton-model`: the market's chance a fixed distance λ√T from the real one).

**Kind:** empirical + model. Data: FRED `BAA` and `AAA` (Moody's seasoned
corporate bond yields, monthly, January 1919 to September 2026), pinned by
sha256 in `data/` with a fetch script and a build script (`src/data.js` holds
the yields as whole hundredths). Quoted, not data: Moody's 1970–2001 default
rates and recovery as Chen, Collin-Dufresne and Goldstein (2009) use them (Baa
4.89% and Aaa 0.63% within ten years, 1.55% and 0.04% within four; recovery
44.9%).

**Shape:** case first (a century of Baa over Aaa: `HistoryFigure`, with
period buttons and the expected-loss line) → what defaults cost (the
expected-loss spread) → guess card (which bond's spread is the bigger multiple
of its expected loss?) → paying for when defaults happen (`ModelLab`, the
hook: stacked bars for Aaa and Baa, the model gap against what Baa paid over
Aaa, correlation and market Sharpe sliders) → `MultipleFigure` (model spread ÷
expected loss against the real chance on log axes, following the lab;
4/10-year toggle) → how sure is 4.89% (`NoiseFigure`: 2,000 seeded 32-year
records in a one-factor world, correlation slider) → costs.

## The model

Expected-loss spread s = −ln(1 − P(1 − R))/T. The market's chance
N(N⁻¹(P) + λ√T) with λ = correlation × market Sharpe (0.5 × 0.43 = 0.215),
and the model spread is the expected-loss spread at the market's chance. The
noise world: annual common shocks Z_t; a large cohort formed in year c loses
N((N⁻¹(P) − √ρ ΣZ/√10)/√(1 − ρ)) within ten years; a 32-year record averages
its 23 cohorts.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Spreads are several times expected losses | Baa over Aaa: 1.16 points 1919–2026 (widest 5.64 in May 1932, 3.38 in December 2008, narrowest 0.32 in January 1966), 1.09 in 1970–2001 (CCDG's Table 1 figure, reproduced), 1.01 in 2002–2026. Expected losses: Baa 0.27, Aaa 0.035, gap 0.24, so 4.6× |
| A default model can't explain it | The model with λ = 0.215 (0.68 sd over ten years): Baa's market chance 16.5%, spreads 0.95 and 0.19, gap 0.76 = 69% of 1.09. Correlation 0.7 explains 99%; at correlation 0.5 it takes a Sharpe ratio of 0.61 (40% more). CCDG's Black–Cox gives 0.90 and 0.18 |
| (found, the guess card) | The multiple falls as default gets likelier: Aaa 5.56×, Baa 3.48× (blue 2.5× and 4.6× the grey); at four years 4.34× and 2.73× |
| The default rate is known | With correlation 0.15 (Basel assumes 0.12–0.24 for large firms), 32-year records show 1.7% to 10.1% (middle 90%) for a true 4.89%; the model's Baa spread over that range runs 0.43 to 1.64 points; the typical record shows 4.39% and 59% come in low. 0.05: 2.9–7.6%; 0.3: 0.9–13.0% |
| (quoted) | Huang and Huang (2012); Chen, Collin-Dufresne and Goldstein (2009) on countercyclical risk prices; Feldhütter and Schaefer (2018); Elton et al. (2001) on state taxes |

## Numbers on the page

`verify/check-numbers.mjs` (74) checks the files' hashes, rebuilds
`src/data.js` and compares, derives every average and month from the data, the
expected-loss arithmetic, the model and implied λ, the multiples, the
one-factor model by quadrature and firm-by-firm simulation, and the seeded
records. `verify/check-browser.mjs` (94 at 390/1280) reads the month line and
the stretch back through the axes, the bars' ends and the pink line, the dots
on the multiple curve, and the noise band and bars (which add up to 2,000).
