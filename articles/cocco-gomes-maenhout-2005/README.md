# cocco-gomes-maenhout-2005 (Fr25)

Finance row 54, Stage 8c (human capital), `finance/portfolios`. Paper explainer (📄).
Built 28 September 2026. Needs `human-capital` (Fr23).

**Kind:** paper, with a numerical solver (dynamic programming, precomputed).
**Shape:** PaperCard → guess card → risky pay and the problem (permanent income,
limit on the share) → solving backwards → the hook (`PolicyLab`, share by age for
the median worker and the middle 80% of 4,000, with the limit and the savings
chart under it) → pay that moves with stocks → what the limit costs (`CostLab`)
→ costs.

## Plan (ours)

Not the paper's calibration. Work from 25 to 64, retire at 65 on 70% of final
pay, live to 89. Permanent income grows 3% for ten years, 1% for twenty, then 0,
and takes a lognormal shock (σ = 0.10) each year. Stocks: 4% premium over a safe
2%, σ = 15.7%. β = 0.96. State is cash on hand over permanent income, on a
geometric grid of 90 points; the value function is stored as F^(1/(1−γ)) and
interpolated by a cubic Hermite curve in log x. Shocks: 3-point (pay) and 5-point
(stocks) Gauss–Hermite. The policy comes from nested golden-section searches over
saving and stock dollars. 4,000 seeded workers, the same luck in every setting.
Twelve settings: γ 3/5/10, limit 1 or 2, correlation 0 or 0.3.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| With no borrowing the share sits at the limit through the early years | Yes at γ = 3 and 5: median at 100% until about 55 at γ = 5, for life at γ = 3 (88% of workers at the limit at 45, γ = 5) |
| The share falls with age as savings grow | Yes: 85% at 60 and 78% at 65 at γ = 5; the median has saved 8.5 years of pay by 65 |
| A looser limit removes the problem | No: at 2 to 1 the median holds 200% until 37 and 134% at 45 |
| Risk aversion | At γ = 10 the limit binds only until 30, and the median holds 65% at 35 and 34% at 65 |
| Pay that moves with stocks (ρ = 0.3) | At γ = 5 the share is 73% at 45 and 52% at 60, jumping from 50% to 80% at 65; at γ = 10 the median holds nothing in her twenties |
| What the limit costs (2 to 1 against none) | 3.0%, 1.6% and 0.16% of consumption at γ = 3, 5, 10; 1.5%, 0.17% and nothing with ρ = 0.3 |
| Cap 3 | Not allowed: at the worst quadrature node (−33%) it wipes out savings |
| (spec) "the median leaves the cap in the early sixties at γ = 10" | Wrong; it leaves at 30 |

## Checks

85 number checks: the file the page reads is what the solver writes (freshness);
a two-year life against a search over whole strategies; a life with no pay against
a first-order condition and a recursion in closed form; properties of every
setting; every prose number. Browser checks read the drawn median, limit line,
savings chart and bar widths back from the pixels.

**Lesson from this article:** a first version interpolated F linearly in log x. It
agreed with the brute-force search and with every property test, but the
closed-form benchmark showed shares 3 to 7% too low, because a straight line gets
the value right to h² and its slope wrong to h, and the share depends on the
slope. Fix: a cubic Hermite curve. All twelve settings were re-solved and the
prose re-derived.

## Sources

Cocco, Gomes & Maenhout (2005), *Review of Financial Studies* 18(2), read at
econpapers.repec.org; Viceira (2001), Benzoni, Collin-Dufresne & Goldstein
(2007), cited by name. Their findings are quoted as theirs and are not tested here.
