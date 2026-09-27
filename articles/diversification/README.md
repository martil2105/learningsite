# diversification (Fr3)

Finance row 13, `finance/portfolios`. Built 26 September 2026 in the cloud
container. Needs `volatility-drag` (Fr1), which it links to for the σ²/2 step.

**Kind:** result + model (closed forms, then a simulated universe that shows the
consequence). **Shape:** lab first (risk curve) → why (covariance grid) → the
hidden part (growth) → simulation. **Hook:** `RiskCurve`.

## Claim as built

For n equal-weighted stocks of volatility σ and pairwise correlation ρ, variance
is σ²(ρ + (1 − ρ)/n): the floor ρσ² is the average covariance, and the gap above
it shrinks as 1/n whatever σ and ρ, so ten stocks remove 90% of the removable
variance and twenty 95%. Expected return is unchanged, but the growth rate rises
by half the variance removed. With σ = 40% and ρ = 0.2 (market volatility
17.9%), a single stock compounds at about 0% against the portfolio's 6.4%, the
middle stock ends 30 years at about a seventh of the portfolio, and only one
stock in six (Φ(−½√((1−ρ)σ²T)) = 16.4%) finishes ahead of it. That share comes
from idiosyncratic risk alone, so it barely moves between simulated universes,
while the portfolio's own result moves a lot.

## What pass 1 moved

- Defaults changed from the slate's σ = 50%, ρ = 0.3 (market volatility 27%,
  too high) to σ = 40%, ρ = 0.2 (17.9%), so the headline moved from "one time in
  eight" to "one in six".
- A "smallest share of stocks carrying the whole gain" readout, meant to echo
  Bessembinder's 4%, was dropped: in the model it is undefined whenever the
  market falls and unstable otherwise. The page cites Bessembinder (2018) for
  the real numbers and says the model gets the same shape.
- "Thirty stocks are within a point of the floor" was wrong (1.15 points); now
  "about a point above".

## Numbers on the page

1/2/10/30 stocks: 40%, 31%, 21%, 19%; floor 17.9%; 90% and 95% removed; growth
0% vs 6.4%, factor about seven over 30 years; 16.4% ahead (formula); seed-11
universe: portfolio ×7.36, middle stock ×1.03, 16.5% ahead. 40 number checks
(the formula against averaging the full covariance grid, Φ against Simpson
integration, 30 universes for the stability claim), 48 browser checks including
the marker and floor drawn at their stated values in pixels.

## Sources

Markowitz (1952); Statman (1987); Campbell, Lettau, Malkiel & Xu (2001); Longin
& Solnik (2001); Bessembinder (2018), abstract checked on the web.

## Built

Ported onto the house scaffold on 27 September 2026 from the cloud build of 26 September: page furniture from cost-curves, the house palette (three categorical colours, ink for the fourth mark, a violet ramp for families), a viewBox on every chart, and the common block of check-browser.mjs. The numbers module and its checks are unchanged.
