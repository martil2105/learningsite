# value-at-risk (Fr12)

Finance row 22, `finance/portfolios`. Built 4 October 2026. Needs Fr3.

**Kind:** concept (Artzner, Delbaen, Eber and Heath 1999; Acerbi and Tasche
2002). Exact binomial sums, no data files. **Shape:** question first (two
bonds, each with a 95% VaR of zero; $50 in each gives $30) → a height and an
area (VaR is the quantile function's height at α, ES the area beyond it over
1 − α) → the lab (`BondsLab`, the hook: $100 over n bonds, the quantile panel
with the ES rectangle of the shaded area, and both numbers against n) →
subadditivity (`PairFigure`: two bonds against two normal losses with a
correlation slider) → what the regulators did (FRTB: 97.5% ES for 99% VaR) →
costs. **Hook:** `BondsLab`.

## The model

$100 split equally over n bonds; each defaults with probability 4%,
independently, losing 60%. Loss = (60/n)·K, K ~ Binomial(n, 0.04).
VaR_α is the α-quantile; ES_α = (1/(1 − α))∫_α^1 q(u) du, computed both by
the atom formula and by integrating the steps.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| VaR isn't subadditive: two bonds with zero VaR, positive together | Yes: $100 in each, VaR 0 each, $60 together; $50 in each, $30 (at least one default 7.84% > 5%) |
| Diversification lowers risk | ES falls with every bond added (48 → 5.12 at 100, at 95% and 99%, checked to 400). The 95% VaR is lowest at one bond (zero), wanders ($12 at 5, dips, $12 at 10, $4.20 at 100) and tends to the $2.40 average from above like 1/√n. At 99% the order reverses: one bond has the highest VaR ($60) |
| ES is coherent | Subadditive on 3,000 random lumpy pairs; for two bonds $61.92 against $96 |
| VaR is fine for normal losses | Yes: a multiple of σ (1.64 at 95%), subadditive at every correlation, equality only at ρ = 1 |
| Basel's 97.5% ES matches 99% VaR | For normal losses: 2.34 σ against 2.33 σ |

## Numbers on the page

`verify/check-numbers.mjs` (54 checks): the two ES routes against each other,
both against 400,000 simulated years; every prose number; ES monotone in n;
VaR positive for 2 to 2,000 bonds and approaching $2.40 like the normal
approximation; subadditivity on random pairs; normal ES against averaging the
quantiles. `verify/check-browser.mjs` (72 at 390 and 1280 px): the dashed
rectangle's area equal to the shaded polygon's (shoelace) at 1, 2 and 100
bonds, the dot and the jump read back through the axes, the lower panel's
dots, average line and monotone ES curve, and the pair bars' heights.
