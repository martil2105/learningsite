# sharpe-ratio (Fr2)

Finance row 12, `finance/portfolios`. Built 3 October 2026. Needs Fr1
(`volatility-drag`).

**Kind:** result (Lo 2002's yearly Sharpe ratio for correlated returns;
smoothing as in Geltner 1993 and Getmansky, Lo & Makarov 2004). **Shape:** case
first (two funds with the same true returns, one priced by the market and one
by appraisers; guess card: which earns more for its risk?) → from a month to a
year (`MemoryFigure`: the variance of a q-month return with and without
memory) → prices that remember (`SmoothLab`: one seeded history, true and
reported, an unsmooth toggle) → the months the correction can't see
(`HorizonChart`) → undoing the smoothing. **Hook:** `SmoothLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Annualise by √12 | Right when months don't remember each other. With an AR(1) correlation of 0.1 a year holds 14.4 months of variance and the rule overstates by 9.6%; at −0.1 it understates by 8.8% |
| (slate) Smoothing inflates the Sharpe ratio | By √((1 + a)/(1 − a)), from the reported volatility σ√((1 − a)/(1 + a)): 0.40 → 0.80 at a = 0.6 (7.5% against 15%), 1.20 at 0.8. The mean is unchanged |
| (slate) Lo's correction undoes it | Not all of it at a year. It gives the Sharpe ratio of the reported yearly returns, 0.44 at 0.6 (9% high) and 24% high at 0.8, because the variance of a q-month reported return is σ²(q − h) with h = 2a(1 − a^q)/(1 − a²): 1.87 months at 0.6, nearly the same at every horizon. Five-year figures are 2% and 4% high. Reported years correlate with the year before by 0.09 |
| Unsmoothing recovers the truth | Exactly, with the right a (two million months, error ~1e-17). With five years of data the estimate of a averages 0.54 when the truth is 0.6 |

The lab's history (seed 10) has its own Sharpe ratio of 0.40, a peak near year 9
and a fall of more than a third after it; the readouts are the closed forms.
The path compounds the returns as changes in the log of the value, so the
reported line tracks the true one with a lag and no drift.

## Numbers on the page

`verify/check-numbers.mjs` (39 checks): closed forms against a two-million-month
simulation (volatility, autocorrelations, the yearly Sharpe ratio of reported
sums, the year-to-year correlation); Lo's formula against the hidden-months
form at every a and horizon; an AR(1) simulation; the bias of the estimated a
over 4,000 five-year histories; the standard error of a ten-year ratio against
4,000 simulated histories. `verify/check-browser.mjs` (72 at 390 and 1280 px):
the unsmoothed series drawn on the true line at two smoothings, the reported
line calmer than the true one, the dots on Lo's curve, the curve starting on the
rule's line and only falling.

## Sources

Sharpe (1966); Lo (2002); Getmansky, Lo & Makarov (2004); Geltner (1993);
Asness, Krail & Liew (2001).
