# binomial-pricing (Fd3)

Finance row 33, `finance/derivatives`, Stage 6. Built 10 October 2026. Needs
Fd2; links Fm14 (`merton-model`'s risk-neutral chances) and Fr18
(`bodie-1995`, Black and Scholes inline).

**Kind:** model. **Shape:** question first (Ann at 90% and Ben at 10%: what
should each pay for the call?) → an assumption lab (`CopyLab`, the hook: the
reader finds the copy, shares and money owed, on a one-step tree) → the
risk-neutral probability → what the real chance does set (`ReturnFigure`:
expected returns of the share and the call against p, two lines crossing at
5%, slopes seven to one) → many steps (`TreeLab`: four quarterly CRR steps,
filled backwards one column per press) → towards Black and Scholes
(`ConvergeFigure`: price against steps, 1 to 100) → a third branch
(`TrinomialLab`: the no-arbitrage band and a CRRA investor's price, real
chances on sliders) → costs.

## The model

One step: $100 → $120 or $90, bank 5% simple, K = $100. Trees: CRR,
u = e^(σ√Δt), d = 1/u, σ = 20%, r = 5% continuous, T = 1. Three branches:
$120 / $105 / $90; state prices q_up = q_down = a; the investor's marginal
utility ∝ (S/S0)^(−γ), with γ solved so she prices the share at $100.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| The real probability never enters the price | Two thirds of a share and $60 owed ($57.14 borrowed) copy the call for $9.52; q = 0.5 prices both the share and the call |
| (what p does set) | E[R_C] − r = Ω(E[R_S] − r), Ω = 7.0 at every p: 90% → share 17%, call 89%; 10% → −7%, −79%; both 5% at p = q |
| Many steps converge to Black and Scholes | 4 quarterly steps: $9.97 (q 0.5378, delta 0.629; the top node after three steps $36.23, checked by hand and by averaging 16 paths); BS $10.45 (checked by integration); 50 → $10.41, 51 → $10.49; even steps low and odd high for all n ≤ 100; 100 steps miss by 2 cents, 1,000 by 0.2 |
| (found) | A third branch ($105): the old copy pays $10 where the call pays $5; no copy exists; arbitrage allows $4.76 to $9.52 (checked as the cheapest super-replicating and dearest sub-replicating portfolios). A CRRA investor pays $8.09 at a 30% middle chance and 60:40 (γ 1.41), $9.52 at 0%, $5.24 at 90%; at 75:25 γ is 3.82 and the price $7.99 |

## Numbers on the page

`verify/check-numbers.mjs` (62) checks the copy as a portfolio, the return
identity at every p, the tree against its 16 paths and node-by-node copies,
Black and Scholes by integration, the zigzag for every n to 100, the band by
replication over a grid, and the investor at every slider position.
`verify/check-browser.mjs` (82 at 390/1280) finds the copy with the sliders,
reads the return lines' crossing and slopes, steps the tree back and reads
its nodes, checks every even dot below Black and Scholes and every odd dot
above, and reads the band and the investor's dot.
