# capital-structure (Fm9)

Finance row 10, `finance/markets`. Built 3 October 2026. Needs Fm7
(`dividend-discount-model`).

**Kind:** model (Modigliani and Miller on one firm, with Merton's one-year loan
so the debt can be risky). **Shape:** question first (guess card: borrow half
at a safe 3%; is the cost of capital 5.5%, 8% or more?) → splitting the same
returns (both propositions in two displays) → lab (`ReturnsLab`: shareholders',
lenders' and the average expected return against D/E, with the safe-debt
straight line, volatility on a slider) → where the bend comes from
(`SplitFigure`: the payoff split stacked to the firm, over the distribution of
next year's assets) → the yield is a promise (`YieldChart`) → taxes
(`TaxFigure`). **Hook:** `ReturnsLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Debt is cheaper, so borrowing lowers the cost of capital | No: the value-weighted expected return is 8% at every ratio and every volatility; shareholders' 8% becomes 13% at D/E = 1 |
| MM II: shareholders' expected return rises in a straight line in D/E | Only while the loan is safe. r_E = r_A + (r_A − r_D)·D/E holds exactly with what lenders expect, so the gap below the safe-debt line is (r_D − 3%)·D/E. At 25% asset volatility and D/E 3: 21.0% against 23.0%, lenders 3.7%, unpaid in 12.9% of years. At 10% the line holds to D/E 3 |
| The cost of debt is the bond's yield | The yield is the promise. At D/E 3 and 25%: 5.2% promised, 3.7% expected; a cost of capital built on the yield reads 9.15% instead of 8% and rises with borrowing, with no distress cost in it. The error is D/V·(yield − r_D) |
| Taxes give debt its value, τD | For a permanent loan as safe as the debt. Kept at a fixed share of value (adjusted continuously), the saving is τ·r_D·D/r_A, three eighths as much at 3% and 8%: $11 against $4.13 on $50 at 22% |

## Numbers on the page

`verify/check-numbers.mjs` (28 checks), with the payoffs integrated over next
year's asset value by Simpson's rule on each side of the kink as the second
route (prices, expected returns and the default chance agree to 1e-10), and Φ
against the integral of the normal density. `verify/check-browser.mjs` (78 at
390 and 1280 px): the dots on their curves, the cost of capital line flat at
8%, the curve 2 points under the dashed line at D/E 3 and on it at 10%
volatility, the pink tail ending at the face value on the shared axis, the
yield curve only rising.

## Sources

Modigliani & Miller (1958, 1963); Merton (1974); Miles & Ezzell (1980);
Miller (1977); Brealey, Myers & Allen.
