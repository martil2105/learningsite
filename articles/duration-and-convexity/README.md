# duration-and-convexity (Fm12)

Finance row 27, `finance/markets`, Stage 5. Built 10 October 2026. Needs
Fm11 (`bond-pricing-and-yield`, whose W_T = P(r)(1 + r)^T and crossing point
it starts from). `dividend-discount-model` already had duration as a
sensitivity and convexity as the bend of a share's price, so this article's
claim is the third job.

**Kind:** result (Macaulay 1938, Redington 1952, Fisher–Weil 1971,
Ingersoll–Skelton–Weil 1978). Exact sums, no data. **Shape:** question first
(sell after 12.2 years; rates to 4% or 12%: which leaves us better off?) →
the average wait (`SeesawFigure`: PV bars on a beam, the fulcrum at D) → the
slope of the price (`PriceCurve`: tangent and convexity, a move slider) → the
hook (`HorizonLab`: money at H against the promise for every new rate, H on a
slider, a button for H = D) → why the floor is the promise (`SpreadFigure`:
one zero, the coupon bond and a 2/30 barbell, all with D = 12.2) → is
convexity free? → a longer bond with a shorter wait (`HumpFigure`) → costs.

## Identities

- d ln P / d ln(1 + y) = −D (the average wait is the slope).
- With W_H(r) = P(r)(1 + r)^H: d ln W_H / d ln(1 + r) = H − D(r), and
  d² ln W_H / d ln(1 + r)² = Var(t), the variance of the payment dates.
- So at H = D(y) the money is lowest when the rate doesn't move, and to
  second order the gain is ½·Var(t)·Δ².

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Duration is the average wait and the price sensitivity | Both, and also the horizon that cancels: at 12.2 years a fall to 4% leaves us +6.91% against the promise and a rise to 12% +5.47% (minimum 0 at 8%) |
| Duration's line plus convexity predicts the price | 1 point down: 12.41% vs 11.26% vs 12.32%; 4 down: 69.17 vs 45.03 vs 62.03; 4 up: −32.22 vs −45.03 |
| Immunisation protects the horizon | It does more: a floor at the promise. 5 years: +40.08 / −18.70; 25 years: −34.15 / +68.25 |
| Convexity is valuable | The gain is ½·Var(t)·Δ²: one zero 0, coupon bond (spread 9.4 years) +6.91% at 4%, barbell (13.5 years) +14.57%. With parallel moves of a flat curve that is free money (Ingersoll–Skelton–Weil); at a point a year the barbell's extra convexity is worth 0.78% a year, which yields must take back |
| Longer maturity, longer duration | Not for discount bonds: a 2% coupon at 8% peaks at 16.4 years at 34 years to maturity and falls to 13.6 at 100 (perpetuity 13.5); the par bond never passes 13.5 |
| (costs) | A year on, horizon 11.2 against a wait of 12.1; after ten, 2.2 against 10.6: rebalancing |

## Numbers on the page

`verify/check-numbers.mjs` (51): on 300 random coupon bonds, the average wait
against the numerical slope of the log price, the minimum of W_D found by
golden-section search, d ln W/d ln(1 + r) = H − D and the second derivative
= Var(t) by finite differences, the floor; every prose number.
`verify/check-browser.mjs` (88 at 390/1280): the beam's moments about the
fulcrum cancel (in pixels), the dots on the price curve and the tangent, the
curve above the line, the valley's floor on the promise at 8%, the zero flat
and the barbell above the coupon bond, the hump's peak and the perpetuity line.
