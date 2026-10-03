# fundamental-law (Fr8)

Finance row 18, `finance/portfolios`. Built 3 October 2026. Needs Fr2.

**Kind:** result (Grinold 1989; the swing after Qian and Hua 2004 and Ding and
Martin 2017). Simulation only, no data files. **Shape:** question first: two
managers (`GuessCard`: A, IC 0.06 on 50 stocks; B, IC 0.02 on 1,000) → skill
is a small correlation (`IcScatter`) → breadth (the law) → when the IC itself
moves (`BreadthLab`, the hook) → the two managers again (`ManagerBars`) →
where the extra risk hides (`RiskLab`) → costs. **Hook:** `BreadthLab`.

## The model

Each month, standardised forecasts z_i for N stocks and outcomes
r_i = c z_i + √(1 − c²) e_i, where c is the month's IC, drawn with mean IC and
standard deviation σ (the swing). The active return per unit position is
R = (1/N) Σ z_i r_i, so E[R] = IC and Var[R] = σ² + (1 + IC² + σ²)/N. The
annual ratio is √12 times the monthly one. σ = 0 is Grinold's world, where
IR = IC√N/√(1 + IC²).

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| IR ≈ IC × √breadth | Exact limit with σ = 0 (within 0.2% of IC√N for every IC on the page) |
| More stocks always raise IR | With IC 0.02, σ 0.05 (κ = 1.5 at 500 stocks, Qian and Hua's average): 1.03 at 500 against Grinold's 1.55; 1.26 at 2,000 against 3.10; ceiling 1.39. 500 stocks are worth 222 independent bets a month, 2,000 are worth 333, never more than 400 |
| A faint edge on many bets beats a strong edge on few | Grinold: B 2.2 against A 1.5. A takes the lead once σ passes 0.037; at 0.05, 1.38 against 1.17 |
| (Qian and Hua) risk models understate active risk | Same expected return, more risk: at σ 0.05 B's realised tracking error is 7.5% against the model's 4% (κ 1.87); A's 4.2% |

## Numbers on the page

`verify/check-numbers.mjs` (59 checks): the closed form against a
stock-by-stock simulation of 6,000 months at four settings (ratio, mean and
volatility); the hit rate against a million pairs; the long-run share of
winning months; every number on the page, rounded as the page rounds; chart
windows for every slider position. `verify/check-browser.mjs` (68 at 390 and
1280 px): the guess card, the scatter's drawn slope against its readout, the
lab's dots and curve read back on the log axis, the ceiling line, the
Grinold curve clipped at the top, the managers' bars and ticks, the risk
lab's expected line and bands, and the counts of months outside them.

## The simulated runs

`RiskLab` draws ten years from seeds 2 (A) and 28 (B), chosen so the run's
realised tracking errors sit within 10% of the long run at swings of 0 and
0.05; the check asserts that, so a change of seed can't silently pick an
unrepresentative run.

## Sources

Grinold (1989); Grinold & Kahn (2000); Clarke, de Silva & Thorley (2002);
Qian & Hua (2004); Ding & Martin (2017).
