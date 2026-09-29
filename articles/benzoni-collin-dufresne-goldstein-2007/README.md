# benzoni-collin-dufresne-goldstein-2007 (Fr26)

Finance row 55, Stage 8c (human capital), `finance/portfolios`. Paper explainer (📄).
Built 28 September 2026. Needs `human-capital` (Fr23), and the slate's Fd11
(cointegration), which is not built and is defined inline in one sentence.

**Kind:** paper, a closed form with three labs. **Shape:** PaperCard → guess card
(does a young worker whose pay is tied to dividends hold more stock, or less?) →
pay that follows dividends (β(s) = 1 − (1−φ)^s, described by its half-life) → one
loading for a whole career (β_H) → `HumpLab` (share by age) → `HorizonLab` (the
loading of each payday, one age at a time) → `EdgeLab` (the knife-edge) → costs.

## Plan (ours)

The human-capital plan: pay 1 a year from 25 to 65, savings 0.5 at 25, safe rate
2%, premium 5%, volatility 18%, γ = 2, so the Merton share π* is 77%. The rule is
share = π* + (π* − β_H)·H/W, where β_H is the present-value-weighted loading of
the paydays left. It turns negative when β_H > π*(1 + W/H), which is 78.6% at 25.

## Claims and verdicts (as shipped, γ = 2 unless stated)

| Claim | Verdict |
|---|---|
| The young can hold a negative stock share | Yes, if the gap closes fast: −720% at a 2-year half-life (3.6 years of pay short), −471% at 3 years |
| The lifecycle share is hump-shaped | Yes, for half-lives up to about 5.8 years. At 5 years: −9% at 25, 85% at 30, 122% at 45, 100% at 60, 77% at 65 (a first probe said "6 to 7 years": wrong) |
| Slow reversion brings back the textbook profile | Yes: 1,996% at 25 at a 20-year half-life (the bond rule gives 4,299%) |
| The sign at 25 flips at a knife-edge | Zero at a half-life of 5.04 years (γ = 2), 13.94 (γ = 3), 22.16 (γ = 4). From 5.0 to 5.5 years the share at 25 goes from −9% to 98% |
| β_H falls with age | At a 5-year half-life 79% at 25, 66% at 45, 48% at 55; at 2 years 92% at 25, 75% at 55 |
| Risk-aversion sensitivity | At γ = 4 the share at 25 is negative at every half-life the sliders allow (2 to 20 years) |
| The level of β_H above which the rule holds no stock rises with age | 78.6% at 25, 96.4% at 45, above 100% by the fifties |

The 5-year knife-edge is a fact about our plan (H/W about 55), not about the paper,
which says only that plausible calibrations lead the young to short stocks.

## Checks

75 number checks. Route B never uses the module's formulas: it lets the gap close
year by year, sums the paydays one at a time and by a geometric series, and checks
the rule by brute force in a one-year coin-flip market where every payday moves by
its own loading (six age and half-life combinations, within 0.002). The zero
crossings are found by scanning half-lives in steps of 0.001. 102 browser checks
read the drawn share, loading, threshold, dots, rings and marker back from pixels.

## Sources

Benzoni, Collin-Dufresne & Goldstein (2007), "Portfolio Choice over the Life-Cycle
when the Stock and Labor Markets Are Cointegrated", *Journal of Finance* 62(5). Their
findings are quoted as theirs and are not tested here. Every figure and number on
the page is ours.
