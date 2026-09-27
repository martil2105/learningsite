# bodie-1995 (Fr18)

Finance row 47, Stage 8a, `finance/portfolios`. Paper explainer (📄). Built 27
September 2026. Needs `time-diversification` (Fr16). Fd6 (`black-scholes`) is
not built, so the article states the put formula and explains the hedge in
words.

**Kind:** result (a pricing identity from a paper). **Shape:** paper explainer:
citation card → the guarantee as a question → guess card → two-panel lab (cost
and chance, sharing the horizon axis) → only σ√T → price against expected payout
→ what came later. **Hook:** `PutLab`.

## Source

Bodie, Z. (1995), "On the risk of stocks in the long run", Financial Analysts
Journal 51(3), 18–22. The paper itself was not reachable; its setup (a put with
the strike at the forward price of the stock portfolio, cost rising with the
horizon) is confirmed from Bodie's own later pension-research working paper and
secondary descriptions. The numbers are ours from the Black–Scholes formula,
not his table. Dempsey, Hudson, Littler & Keasey (1996), FAJ 52(5): abstract
read.

## Claims and verdicts

| Claim | Verdict |
|---|---|
| The guarantee costs more for longer horizons | True: 2N(σ√T/2) − 1 = 8.0%, 24.8%, 41.6% at 1/10/30 years (σ = 20%); half the stake at about 45 years |
| The chance of needing it falls | True: 42% → 14% |
| The price uses the premium | No: checked with a pricing-kernel-weighted real-world integral that reads the premium (0%, 2%, 6%, 10%) and a CRR tree; also with a 3% safe rate |
| Only σ√T matters | 30 years at 20% = 7.5 years at 40% |
| (found in probing) Price vs expected payout | The real expected payout is the Fr16 hump (5.5% → 7.8% → 5.1%); price/payout is 1.5× at 1 year, 8.2× at 30. At a zero premium the two coincide exactly |

## Checks

37 number checks; 74 browser checks, including the cost curve and dot not
moving when the premium slider moves (and the chance dot moving), the payout
line landing on the price line at a zero premium, and both panels' markers
aligned.

## Sources

Bodie (1995); Black & Scholes (1973); Merton (1973); Dempsey et al. (1996);
Pástor & Stambaugh (2012).
