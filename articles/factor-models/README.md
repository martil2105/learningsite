# factor-models (Fr6)

Finance row 16, `finance/portfolios`. Built 3 October 2026. Needs Fr5.

**Kind:** result + empirical (an exact least-squares identity, on Kenneth
French's five factors, momentum factor and lowest-beta decile, July 1963 to
August 2026, 202608 CRSP vintage, pinned in `data/`). **Shape:** question first
(guess card: what happens to value's 4.5% CAPM alpha when profitability and
investment join the model?) → alpha is an intercept → the identity → each
factor's price (`PriceBars`) → assumption lab with the model on the controls
(`AlphaLab`: asset tabs, factor toggles, model presets, a waterfall from the
CAPM alpha) → value explained by investment → alpha can grow → the lowest-beta
shares. **Hook:** `AlphaLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Alpha is skill or mispricing | It belongs to an asset and a model: value's CAPM alpha 4.5% (t 3.6) becomes −0.3% (t −0.3) with five factors; investment (loading 1.00 × its own 4.1%) takes 4.1 points, profitability 0.6, size 0.1 |
| Adding factors explains alpha away | Exactly: alpha_small − alpha_big = Σ b_k × alpha_k∣small (all 64 asset–model pairs and 48 nested pairs to 1e-15). It can also grow: momentum 8.3% → 9.8% with value (loading −0.33), value 4.5% → 5.9% with momentum |
| The low-beta anomaly (Fr5) | 2.5% (t 2.6) under the CAPM, 1.7% with three factors, 0.3% (t 0.4) with five, −0.1% with profitability and investment alone |

## Numbers on the page

`verify/check-numbers.mjs` (38 checks): hashes and a fresh parse; raw values
read from the CSVs; normal equations against Gram–Schmidt QR; the identity for
every model; every quoted alpha, t, loading and step; the standard errors
(0.88–1.83); chart windows for every model. `verify/check-browser.mjs` (52 at
390 and 1280 px): price bars read back, the waterfall's steps chaining from the
CAPM bar to the blue bar, the investment step 4.1 points long, the asset's own
factor disabled.

## Data

`scripts/fetch-data.mjs`, `scripts/build-data.mjs`, `scripts/data-lib.mjs`;
hashes in `data/sources.json` and `data/SOURCES.md`.

## Sources

French Data Library; Fama & French (1993, 2015, 2016); Carhart (1997);
Asness, Moskowitz & Pedersen (2013); Harvey, Liu & Zhu (2016); Frisch & Waugh
(1933).
