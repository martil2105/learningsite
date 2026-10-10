# put-call-parity (Fd2)

Finance row 32, `finance/derivatives`, Stage 6. Built 10 October 2026. Needs
Fd1 (`forwards-and-futures`: the forward price and borrowing). Kept separate
from Fd3 (the slate's "may merge"): parity has its own gap, the forward it
needs. Links Fm3 (borrowing shares).

**Kind:** result, with a quoted case (Palm and 3Com, Lamont and Thaler 2003:
first-day prices and Table 6, Palm's option quotes on 17 March 2000).
**Shape:** comparison spine: a call and a put side by side in every figure,
their difference pinned. Payoffs (`PayoffFigure`: strike and ending price,
toggle to the difference) → parity → guess card ($12 call, rates zero: the put?)
→ why it holds so tightly (conversions) → whatever the model (`ModelsLab`, the
hook: call and put prices against the strike in a smooth model and a crash
model, the other model dashed, the call minus the put unmoved) → the forward
hiding in option prices (`IvLab`: implied volatilities of calls and puts with
a borrowing fee, worked out with the wrong forward and with the options' own)
→ Palm (`PalmFigure`: synthetic share ranges for May, August, November
against $55.25) → a box spread → American options (the band) → costs.

## The model

Share $100, r = 4%, a year. Smooth model: lognormal 20%. Crash model: a 10%
chance of a −30% jump, otherwise lognormal 15%, scaled so the forward is
$104.08 in both. IV lab: true volatility 25%, borrowing fee b as a carry.
Palm: K = $55, LIBOR simple interest over 2, 5 and 8 months.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| C − P = S − Ke^(−rT), model-free | Payoffs differ by S_T − K everywhere; $3.92 at $100. At $110: smooth $5.66 / $11.35, crash $4.53 / $10.22 (checked by direct averaging), both −$5.69; the models disagree at every strike |
| Calls and puts at a strike have the same implied volatility | True in any model (crash world: 20.4% at $80, 16.6% at $120, calls and puts equal); but only with the right forward. With a 3% fee the forward is $101.01, and IVs worked out from $104.08 give the put 28.17% and the call 20.45% at $100 (true 25%), and no IV at all for calls below $84.50; the options' own forward puts every option at 25% |
| Parity holds | Palm, 17 March 2000: 1.525 × $95.06 = $144.97 of Palm per 3Com share at $81.81 on 2 March. November options: synthetic short $39.12 (29% below $55.25, the paper's figure to the cent), long $42.62; $12.63 the implied cost of borrowing; 14%, 21%, 29% for May, August, November |
| (also) | A $90/$110 box costs $19.22 in both models; American options (no dividends): S − K ≤ C − P ≤ S − Ke^(−rT), $0 to $3.92 at $100 |

## Numbers on the page

`verify/check-numbers.mjs` (54) checks parity at every strike in both models,
the crash model by direct averaging, the IVs both ways, Palm against the
paper, and the chart windows. `verify/check-browser.mjs` (78 at 390/1280)
reads the payoff lines and the difference, the unmoved black line across
models, the IV lines at $100 and their flat line with the right forward, and
Palm's bars against the price line.
