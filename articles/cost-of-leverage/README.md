# cost-of-leverage (Fr28)

Finance row 57, Stage 8d (leverage across a lifetime), `finance/portfolios`.
Concept with a closed form. Built 28 September 2026. Needs `merton-share` (Fr21)
and the slate's Fm3 (margin), which is not built: the page defines a margin loan
inline in one sentence.

**Shape:** guess card → `KinkLab` (Merton's line split at 100% by the spread; the
band held at exactly 100%) → `LifeLab` (the human-capital plan with a spread) →
`CostLab` (the certain return given up) → who borrows near the safe rate → costs.

## Model (ours)

Premium e = 5 points, volatility σ = 18%. A lender holds e/(γσ²), a borrower at a
spread s holds (e − s)/(γσ²), and everyone with γ between (e − s)/σ² and e/σ²
holds exactly 100%, a band s/σ² wide (0.309 per point). The plan for `LifeLab` is
the human-capital plan (pay 1 a year from 25 to 65, savings 0.5 at 25, saving 0.1
a year, growth 4%), with future pay discounted at the borrowing rate while she
borrows.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| Slate: with a 2-point spread no investor with γ ≥ 1 levers | True at γ ≥ 1, but the band's lower end is 0.926, so γ just below still levers (γ = 0.9: 103%; γ = 0.5: 309% falls to 185%) |
| A band sits at exactly 100% | Yes: lower ends 1.23 / 0.93 / 0.62 / 0.31 / 0 at 1 to 5 points, upper end 1.54 |
| Certain return given up at a 2-point spread | 2.94 points at γ = 0.5, 1.29 at 0.75, 0.48 at 1, about 0 above 1.54. Sharpe falls from 0.28 to 0.17 |
| Reward for risk kept, for a saver who borrows either way | (1 − s/e)²: 64% / 36% / 16% / 4% at 1 to 4 points. It is relative to the same saver borrowing at the safe rate |
| Young saver at γ = 2 | Share at 25: 4,299% (0 points), 2,915% (1), 1,879% (2), 1,090% (3), 480% (4), 100% (5). Borrows until about 62 / 59 / 55 / 48 / 38 / never, pinned to 62, then lends; 77% at 65 |

## Checks

100 number checks. Route B: a numerical short-step expected-utility maximisation
against the closed form (within 1%); a one-year coin-flip market where brute force
finds the strip 0.9906 to 1.6797 (log utility at γ = 1); a dynamic programme in a
coin-flip market against the rule (within 1.94%); scans for the certain return
and the reward kept. 126 browser checks read the band, the dots and the lines
back from drawn geometry at 390 and 1280 px.

## Sources

Fleming & Zariphopoulou (1991), "An optimal investment/consumption model with
borrowing", *Mathematics of Operations Research* 16(4), for Merton's problem with a
higher borrowing rate; Brennan (1971), *Journal of Financial and Quantitative
Analysis* 6(5); Ayres & Nalebuff (2008), NBER Working Paper 14094. The model, the
plan and every number on the page are ours.
