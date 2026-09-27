# mean-variance-optimisation (Fr4)

Finance row 14, `finance/portfolios`. Built 26 September 2026 in the cloud
container. Needs `diversification` (Fr3). Carries the "estimating expected
returns" material the slate folded into it.

**Kind:** result + model. **Shape:** case first (a ten-asset optimiser against
the truth) → the mean blur → the geometric result → the years chart → fixes.
**Hook:** `WeightsLab`.

## Claim as built

With the covariance known perfectly, the plug-in tangency portfolio's
out-of-sample Sharpe ratio is SR* × cos(angle), where in whitened coordinates
the estimate is (a + g, χ_{N−1}) with a = SR*·√T. So only N and SR*√T matter,
E[cos] ≈ √(a²/(a² + N)), and matching an equal-weight portfolio that already
gets a share k of the best needs T ≈ (N/SR²)·k²/(1 − k²) years: at SR* = 0.5 and
k = 0.8, 68 years for 10 assets, 174 for 25, 353 for 50 (common-random-number
Monte Carlo, checked against quadrature). DeMiguel, Garlappi & Uppal's 3,000
months for 25 assets (everything estimated) is the same scale as our 2,100.

## What pass 1 moved

- The world is designed so the best Sharpe is 0.50 and 1/N gets 0.40 exactly
  (ten assets, 20% vol, correlation 0.3, means 2.4%–7.4% evenly spaced).
- The lab showed that estimating the covariance as well costs almost nothing
  at N = 10 with monthly data (0.326 against 0.330 over 1,000 thirty-year
  histories), which let the article drop the covariance and keep the clean
  known-Σ result, citing Chopra & Ziemba (1993).
- First-draft win rates came from 200 histories ("three in four"); at 1,000
  histories they are four in five at 30 years and just over one in five losses
  at 100 years. The page now uses the 1,000-history figures.
- Merton's point (the mean's precision depends on span, not frequency) became a
  toggle in the blur figure, checked by simulation.

## Numbers on the page

Best 0.50, equal weights 0.40; lab opening (seed 19, 30 years) 0.33; 81% / 22%
win rates; 0.326 vs 0.330; ±2.3 points at 16% over 50 years, 256 years for ±1;
3.7-point blur vs half-point gaps; a = 2.7 and √9 = 3; cloud average 0.33; 68 /
174 / 353 years; approximation 71 / 178; 2,100 months; ×2.3 at k = 0.9 and ⅓ at
k = 0.6. 32 number checks, 46 browser checks including the 0.8 line drawn at
36.9° (equal axis units) and every green dot on the right side of it.

## Sources

Markowitz (1952); Merton (1980); Black & Litterman (1992); Chopra & Ziemba
(1993); Jagannathan & Ma (2003); Ledoit & Wolf (2004); Kan & Zhou (2007);
DeMiguel, Garlappi & Uppal (2009), abstract checked on the web.

## Built

Ported onto the house scaffold on 27 September 2026 from the cloud build of 26 September: page furniture from cost-curves, the house palette (three categorical colours, ink for the fourth mark, a violet ramp for families), a viewBox on every chart, and the common block of check-browser.mjs. The numbers module and its checks are unchanged.
