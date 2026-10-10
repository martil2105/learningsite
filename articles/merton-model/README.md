# merton-model (Fm14)

Finance row 29, `finance/markets`, Stage 5. Built 10 October 2026. Needs
Fm12; the option is explained inline (Fd3, `binomial-pricing`, comes later in
reading order), as `capital-structure` did. Links Fr13 (the leverage effect)
and Fm3 (the mirror argument).

**Kind:** model + result (Merton 1974; Black and Cox 1976; Black 1976). Closed
forms, quadrature and seeded simulation, no data. **Shape:** lab first, after
a guess card: two clues (what the shares are worth, how much they move) as two
curves of possible firms in the plane of asset volatility and asset value,
crossing at the firm (`SolveLab`, the hook) → why the shares move more
(`FallFigure`: the same firm at other asset values, share volatility above and
the market's chance of default on a log axis below) → distance to default →
whose chance (`WhoseFigure`: how many times the real chance the market's chance
is, against the real chance on log axes, for 1 and 10 years, Sharpe slider) →
default before the debt is due (`PathsFigure`: 200 seeded years, Merton's rule
against Black and Cox's) → costs.

## The model

Assets dV/V = μ dt + σ_V dW; one zero-coupon debt, F = $70 due in T = 1 year;
safe rate 3% continuous. Shares are a Black–Scholes call on V struck at F. The
firm we follow: shares worth $30 moving 60% a year. The safer firm: $40 moving
45%, owing $60. Real drift μ = r + λσ_V with λ = 0.2 unless stated.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Shares are a call on the assets | Exact (formula = discounted average payoff by quadrature). The two clues give V = $97.78, σ_V = 18.81%. The price curve is nearly flat (under $2 between 5% and 30% volatility, near E + PV(F) = 97.93), so the price pins the assets and the volatility pins their volatility |
| Share volatility is the firm's risk | Shares move N(d1)·V/E = 3.19 times the assets (V/E 3.3, N(d1) 0.98). Assets −10%: shares −31%, volatility 60% → 75%, market's chance 3.27% → 9.99% (×3); −20%: −60% and 97%. The leverage effect, with the assets' risk unchanged |
| The share price implies a probability of default | It implies the risk-neutral one: d2 = 1.84, N(−d2) = 3.27%. N⁻¹(Q) = N⁻¹(P) + λ√T, and the shares' Sharpe ratio equals the assets' moment by moment (0.2000 and 0.4000 by quadrature). At λ = 0.2 = 0.5 × 0.4: real 2.06%, ratio 1.59; safer firm 0.29% vs 0.16%, 1.88; a ten-year loan with a 2.06% real chance: 3.86 |
| Default happens when the debt is due | Black–Cox: 4.60% touch $70 within the year against 2.06% ending below (exactly twice with no log drift; a 20,000-path simulation with the barrier shifted by 0.5826σ√dt agrees). The chart's 200 seeded paths (seed 105): 4 pink, then 9 |
| (costs) | Merton's lenders recover 93 cents on the dollar in default (checked by integration) and charge 0.23 points; senior unsecured bonds have recovered about 45 cents (Moody's, via Chen, Collin-Dufresne and Goldstein 2009). KMV's default point and empirical lookup (Crosbie and Bohn 2003) and Bharath and Shumway (2008) quoted |

## Numbers on the page

`verify/check-numbers.mjs` re-derives every number from `src/merton.js`: the
solver against both clues at every slider position, the call against
quadrature, the shift equation both ways, the equal Sharpe ratio by quadrature
over a small step, Black and Cox against a fine simulation, the recovery by
integration, and the seeded chart's counts. `verify/check-browser.mjs` reads
the crossing back through the axes and puts it on both curves, moves both
clues, reads the falling-assets dots onto their curves, the Sharpe slider's
dots onto the one-year curve and the flat curves at zero, and counts the pink
paths under each rule.
