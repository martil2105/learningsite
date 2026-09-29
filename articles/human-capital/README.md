# human-capital (Fr23)

Finance row 52, Stage 8c (human capital), `finance/portfolios`. Concept.
Built 28 September 2026. Needs `merton-share` (Fr21). First use of the
**lifetime exposure timeline** (age on x, savings stacked under future pay,
stock money above), which the slate reuses in `lifecycle-leverage`,
`ayres-nalebuff-2008`, `cocco-gomes-maenhout-2005` and `lifecycle-simulator`.

**Kind:** concept (with a closed form). **Shape:** lab first after a short
build-up (future pay as a bond, the rule on total wealth) → the lab (two
panels sharing the age axis: wealth in years of pay, and the share of
savings on a −100% to 300% window) → when pay moves with the market (the
identity) → a borrowing limit. **Hook:** `LifeLab`.

## Plan (ours)

Pay 1 a year from 25 to 65, valued at a safe 2%; savings start at half a
year's pay, save 10% of pay, grow 4% a year. Merton share 77% (5% premium,
18% volatility, γ = 2). A share β of future pay moves with stocks.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| Young should hold more because of the horizon | No (row 51); because of future pay: share π*(1 + H/W) |
| How much more | 4,300% of savings at 25 (H/W ≈ 55); ≈850% when H/W = 10 (about 36); below 300% at 48, 200% at 53, 100% at 62; π* at 65 |
| (found in probing) In money | The rule wants about 21 years of pay in stocks at 25 and 9 at 65: the most stock when savings are least |
| (found in probing) Pay that moves with stocks | Share = π* + (π* − β)H/W: flat at β = π*, short until 47 at β = 1; a 25-year-old stays above 100% unless about three quarters of pay moves with stocks |
| Borrowing limits | No borrowing: 100% until 62; 200% (margin): at the limit until 53 |
| The rule is Merton on total wealth | Checked by brute force over whole two-year strategies in a coin-flip market with a safe wage |

## Checks

30 number checks; 54 browser checks, including the rule's line entering the
window at 300% at 48.1 in pixels, the no-borrowing line leaving 100% at 61.8,
the β = 77% line flat to under 6px and flatter than at 75% or 80%, and the
stack's top at 25 read back from the drawn path.

## Sources

Bodie, Merton & Samuelson (1992); Viceira (2001); Cocco, Gomes & Maenhout
(2005); Campbell & Viceira (2002).
