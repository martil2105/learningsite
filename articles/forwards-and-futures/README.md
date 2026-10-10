# forwards-and-futures (Fd1)

Finance row 31, `finance/derivatives`, Stage 6. Built 10 October 2026. Needs
Fm7; links Fm13 (forward rates aren't forecasts either) and Fm3 (borrowing
shares, margin accounts).

**Kind:** model, with one quoted case (NYMEX WTI settlements on 17 and 20
April 2020, from the SPE's *Journal of Petroleum Technology*: May −$37.63 and
June $20.43 on the Monday, down $55.90 and $4.60 on the day). **Shape:** case
first (`OilFigure`: May and June bars on the Friday and the Monday) → two ways
to own the index in a year (`CarryLab`, the hook: 40 seeded years with the
carry line and the quoted price, then what each piece of the arbitrage pays
against where the index ends, flat for the two together; quoted price, rate
and dividend sliders) → guess card (two forecasts, one price) → a price, not a
forecast (`ForecastFigure`: expected-return slider, band, expected path and
the carry line) → oil can be stored but not lent (`CeilingFigure`: the prices
an arbitrage rules out, index against oil) → back to April 2020 → daily
settlement (`MarginFigure`: three curated years; the index and futures price,
the tailed margin account landing on the forward's payoff, and one contract
minus the tailed position) → costs.

## The model

Index S0 = $100, r = 4%, q = 1.5%, continuous; F = S0·e^((r−q)T) = $102.53.
Paths lognormal at 18% volatility. Oil: spot $60, storage $0.50 a barrel a
month paid monthly, financed at r: ceiling $68.56 for a year. Futures price
F_t = S_t·e^((r−q)(T−t)), settled daily over 250 days; tailing holds
e^(−r(T−t₊₁)) contracts over each day.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| F = S·e^((r−q)T) by arbitrage | $102.53. At $104: borrow $98.51, buy 0.985 units (growing to one), sell forward, keep $1.47 on every one of the 40 seeded years; below $102.53 the trade reverses ($100: $2.53) |
| The forward is the market's forecast | Both traders (expecting $112 and $97) accept $102.53. At 8% expected, E[S_T] = $106.72 and buying forward expects $4.18; at 4% the two meet. Contango here is interest minus dividends |
| Cost of carry holds for commodities | Only as a ceiling ($68.56); at $64 holding oil must be worth at least $4.56 (the convenience yield); backwardation can't be arbitraged |
| April 2020 | June ≤ May + a month's storage, so a month at Cushing cost at least $58.06 a barrel (Friday: $6.76) |
| Futures are forwards | Tailed futures land on the forward's payoff on every path (200 more checked to 1e-9); one contract all year: $21.83 against $21.39 (rises), −$8.94 against −$9.27 (rises then falls back), −$27.88 against −$27.24 (falls). Equal prices with fixed rates (Cox, Ingersoll and Ross 1981) |

## Numbers on the page

`verify/check-numbers.mjs` (46) runs the arbitrage as a trade on the seeded
paths, checks the band against simulated years, builds the oil ceiling as a
debt account, settles the futures day by day on 203 paths, and checks the
chart windows. `verify/check-browser.mjs` (90 at 390/1280) reads the oil bars,
the carry line, the forty end dots on the flat line, the share and forward
lines' zeros, the forecast dots, the ceiling and quoted lines, and the margin
paths back through the axes.
