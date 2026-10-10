# drawdowns (Fr15)

Finance row 25, `finance/portfolios`, Stage 4. Built 10 October 2026. Needs
Fr1; links Fr9 (`kelly-criterion`, falling from today rather than from a
peak), Fr13 and Fr2.

**Kind:** result (Magdon-Ismail, Atiya, Pratap and Abu-Mostafa 2004) + a small
empirical check on French's daily file (202608 vintage, pinned in `data/`).

**Shape:** question first (a ten-year backtest; what's the chance ten live years
go past its worst?) → one steered path (`PathLab`, the hook: a backtest then 30
live years, live drawdowns measured from the live start, the backtest's worst
carried across, five curated seeds, Sharpe toggle) → how fast the worst grows
(`ScaleFigure`: medians against years on a log axis; a toggle to the strategy's
own units, where every Sharpe ratio above zero lies on one curve) → live
against the backtest (`NextFigure`: the chance of going past against live years
for 5/10/20-year backtests, 50% at equal lengths) → how deep is too deep
(`DeepFigure`: densities for Sharpe 0.5 and 0, a stopping line) → climbing back
(Wald: d/μ) → the US market against a random walk (`UsFigure`) → costs.

## The model

Log value X_t = μt + σW_t (μ = 7.5%, σ = 15%, Sharpe 0.5 unless stated). The
drawdown is a reflected Brownian motion; P(D_T < h) solves a heat equation on
[0, h] (reflecting at 0, absorbing at h), summed as an eigenfunction series in
`src/drawdown.js`: with drift, ψ = e^x (cos kx − sin kx / k), tan kh = k, plus a
hyperbolic mode for h > 1 (solved for δ = 1 − κ so it stays accurate when
κ ≈ 1); with no drift, cos((n + ½)πx/h). Scaling: depth in σ²/μ, time in
σ²/μ² = 1/SR², so one function serves every strategy with an edge.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| The backtest's maximum drawdown is a bound; going past it means something changed | Two stretches of equal length are exchangeable: live trading goes past the backtest's worst within the backtest's own length exactly half the time (50% at 5, 10 and 20 years, Sharpe 0.5 and 0; 2,000 simulated pairs: 50.7%). Ten-year backtest: 4.0% within a year, 31.0% within 5, 68.4% within 20, 82.4% within 40 |
| Expected maximum drawdown grows like √T (the slate) | Only with no edge: E[D] = √(π/2)·σ√T exactly. With an edge it bends to ½ ln(SR²T) + 0.635 (in σ²/μ) after about 1/SR² years (4 at 0.5). Medians at 15%: no edge 15.8 / 42.0 / 66.4% at 1 / 10 / 40 years; Sharpe 0.5: 13.6 / 29.5 / 40.8% |
| (found) | In units of σ/SR and 1/SR², every Sharpe ratio above zero has the same worst drawdown; with no edge only L/B matters, so P(L = B/2) + P(L = 2B) = 1 (27.2% + 72.8%) |
| A deep drawdown means the edge has gone | A line a working strategy crosses 1 time in 20 catches a dead one 15.1% (2 years, 31.4%), 24.1% (5 years, 40.6%), 35.4% (10 years, 47.3%) |
| Long time underwater means trouble | Wald: expected time back from d log points is d/μ, free of σ (30% → 4.8 years); with no edge it's infinite |
| Real markets are like this | US total return, Jul 1926–Aug 2026 (drift 9.8%, vol 17.5%): a random walk's century has a median worst of 50.9% and 1 in 100 past 74.1%. 2007–09 (54.6%) fits; 1929–32 (84.1%, back Feb 1945) happens 1 century in 2,400, with volatility at about twice its average. Recoveries beat drift alone: 12.6 vs 18.8 years, 3.0 vs 8.1 |

## Numbers on the page

`verify/check-numbers.mjs` (89): precompute freshness and the data hash; the
series against √(πτ/2) exactly with no drift, against both asymptotes, against
simulated walks with drift (corrected for daily steps by 1.165√dt), the
scaling between two strategies, the median against 3,000 simulated decades;
the 50% identity over 2,000 seeded pairs and at every backtest length; the
mirror; the densities' areas; Wald by simulation; every prose number.
`verify/check-browser.mjs` (94 at 390/1280): the pink dot past the dashed line,
the staircase monotone, the shading reaching the deepest step, the scaled
curves on the master within 1px, the 50% dot on its curve, the 5% tail's
area by shoelace, the US dip and lines read back through the axis.
