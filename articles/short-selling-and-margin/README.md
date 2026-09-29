# short-selling-and-margin (Fm3)

Finance row 3, `finance/markets`. Built 29–30 September 2026.

**Kind:** model (institutional rules: Regulation T's 50% initial margin, FINRA
Rule 4210's 25% long and 30% short maintenance margins).
**Shape:** question first (guess card: how far can the price fall before the
call?) → account lab (equity and the requirement, two straight lines crossing
at the call; long/short toggle, price, both margins) → meeting the call (the
1/k multiple) → selling short → forty simulated years and the reflection
principle. **Hook:** `AccountLab`; `PathsLab` carries the second claim.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Slate: the call comes after a fall of (m − k)/(1 − k), and a short's after a rise of (m − k)/(1 + k) | Yes, both exactly (against bisection on the balance sheet for every m and k): a third for a long at 50/25 ($66.67), 15.4% for a short at 50/30 ($115.38), 20% for a short at 50/25 |
| "2 to 1" margin | A starting point. Leverage rises as the trade goes wrong and the call comes when it reaches 1/k (4 for a long at 25%, 3.33 for a short at 30%); two thirds of a long's stake is gone at the call, 30.8% of a short's |
| A margin call asks for the shortfall | In cash, yes. Met by selling (or buying back), it takes shortfall/k of stock: $2,000 to cover $500 at 25% (four times), $4,166.67 to cover $1,250 for a short at 30% |
| A short's loss has no ceiling | True, and beside the point for most shorts: the call is almost three times closer in log terms (0.14 against 0.41). With no drift in the log price, the chance of a call within a year is 2Φ(−b/σ√T): 17.7% long and 63.3% short at 30% volatility, 4.3% and 47.4% (eleven times) at 20% |

## Numbers on the page

`verify/check-numbers.mjs` (52 checks): the account against bisection, the
call met by actually trading, Φ against quadrature, the chance of a call
against 60,000 simulated daily years at 20% and 30% (with the
Broadie–Glasserman–Kou shift for daily checks), and the lab's seeded forty
years (seed 21: 7 long calls and 25 short calls at 30%).

## Sources

Regulation T (12 CFR 220), FINRA Rule 4210 (checked 29 September 2026),
Brunnermeier & Pedersen (2009), D'Avolio (2002), Shreve (2004) §3.7.
