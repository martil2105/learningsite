# volatility-clustering (Fr13 📊)

Finance row 23, `finance/portfolios`. Built 4 October 2026. Needs Fr11.

**Kind:** empirical + model. French's daily market file (202608 vintage),
pinned in `data/`, and GARCH(1,1) fitted by maximum likelihood (precomputed:
the fit takes several seconds). **Shape:** question first (which was the bigger
surprise, 19 October 1987 or 26 September 1955?) → sign and size
(`AcfFigure`: autocorrelation of returns and of their sizes by lag, with a
band robust to clustering) → GARCH and its half-life → three years with the
forecast band (`VolLab`, the hook) → the ten biggest days two ways
(`RankFigure`) → how much of the fat tail is clustering → costs.
**Hook:** `VolLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Returns are uncorrelated | Almost: 0.05 at one day, under 0.03 at every other lag; 3 of 36 lags poke out of the robust band, slightly |
| Squared returns are strongly correlated | Sizes (absolute returns) are: 0.30 at one day, 0.21 a month, 0.11 a year, 0.07 at 500 days |
| GARCH(1,1) captures it | α 0.10, β 0.89, half-life 64 trading days, long run 1.11% a day (17.6% a year); 5.1% of days outside two forecast sd (normal 4.6%). But its implied memory of squared returns starts too high (0.40 against 0.26) and dies too fast (0.002 against 0.021 at 500 days) |
| Fat tails come from changing volatility | Partly: against the forecast, kurtosis 19.1 → 7.3 and 5 sd days 101 → 26; GARCH with normal shocks gives a median 41 such days per simulated century, about two fifths. 1987 falls from 16.2 to 8.5 sd and 26 September 1955 (6.1 → 14.2) becomes the century's biggest surprise; 16 March 2020 (−12.0%) is 2.3 |
| Falls raise volatility more than rises | corr(r_t, \|r_{t+1}\|) = −0.09 (GJR, quoted as the fix) |

## Numbers on the page

`verify/check-numbers.mjs` (63 checks): provenance; the precomputed fit fresh;
no point on a grid around it has a higher likelihood; the fit recovers
α and β from simulated GARCH data; every prose number; the forecast formula
against iterating the recursion; the robust band against simulated GARCH
days; the squared-return ACF formula against a long simulation; 301
simulated centuries for the 41. `verify/check-browser.mjs` (66 at 390 and
1280 px): the ACF dots and lines read back, the robust band's width, every
pink line outside the band and every grey one inside it, the crash's line at
−17.4%, the rank labels and the first bar's length on the axis.
