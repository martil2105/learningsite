# bodie-merton-samuelson-1992 (Fr24)

Finance row 53, Stage 8c (human capital), `finance/portfolios`. Paper explainer (📄).
Built 28 September 2026. Needs `human-capital` (Fr23).

**Kind:** paper, concept with an exact closed form. **Shape:** PaperCard → guess
card → hours as a second asset (Cobb–Douglas, the spending plan) → the hook
(`FlexLab`, two workers and one year in the market) → where the gap comes from
(two Merton problems, one algebra step) → `AcrossLab` (the same gap at every
savings and horizon, the retirement corner) → costs.

## Plan (ours)

Utility (C^a L^(1−a))^(1−γ)/(1−γ), wage 1 a year of full time, safe at 2%, A the
annuity factor for the years left (22.4 for thirty). Savings W in years of pay.
Both workers spend what they own evenly over the years left, which fixes hours at
h = a − (1−a)W/A. Merton share 77% (5-point premium, 18% volatility, γ = 2).

## Claims and verdicts

| Claim | Verdict |
|---|---|
| Flexibility raises stock holdings | Yes, at the same wealth, hours and spending today: by 1 + (1−a)/(aγ) (1.50 at a = ½, γ = 2; 1.25 at γ = 4; 1.10 at γ = 10; 2.17 at a = 0.3) |
| It depends on wealth or age | No: identical across savings 0–8 and 5–40 years left, by both routes |
| Why | Flexible: Merton on W + A at risk aversion γ. Fixed: Merton on W + hA = a(W + A) at γ_C = 1 − a(1 − γ) |
| (found in probing) Consumption | The fixed worker's consumption is exposed γ/γ_C times more (1.33 at γ = 2, 1.82 at γ = 10) although she holds fewer stocks |
| (found in probing) Hours | Each unit lost adds (1−a)/A hours; hours are a − (1−a)W/A, and stop at W = aA/(1−a) (22.4 for thirty years at a = ½) |
| (found in probing) Spending | The spending plan sets today's hours. Spending s times the even rate gives γ_C/(γ(1 − (1−a)s)), above one exactly when s > 1 − 1/γ (0.5 at γ = 2). 1.9 at s = 1.2, 1.25 at s = 0.8 |
| A first-draft line said flexibility is worth most where A is small | Dropped: the factor doesn't depend on A |

## Checks

83 number checks: a search over the consumption/leisure split, risk aversion
measured from curvature, portfolio demands by search in a coin-flip market with
the labour choice made inside every outcome; 102 browser checks, including the
consumption lines' slopes (0.772 and 1.029) and the stock lines' ratio (1.5 at
savings 2, 8, 15 and 21) read from drawn paths.

## Sources

Bodie, Merton & Samuelson (1992), the abstract read at ideas.repec.org; Gomes,
Kotlikoff & Viceira (2008), cited by title; Merton (1969). The paper's own model is
richer and is not reproduced.
