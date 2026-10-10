# bond-pricing-and-yield (Fm11)

Finance row 26, `finance/markets`, Stage 5. Built 10 October 2026. Needs Fm7
(`dividend-discount-model`); links `npv-vs-irr` (the reinvestment question
for projects).

**Kind:** concept (a yield is a promise about reinvestment). Exact sums, no
data. **Shape:** build-up (one rate for every payment: `PriceFigure`) → question
first for the second half (30-year 8% bond, rates fall to 4% the next day: what
do we earn?) → what the yield promises (`PullFigure`: three bonds at 4%, price
paths and each year's return split into coupon and price change) → where the
money comes from (interest on coupons) → the hook (`RealisedLab`: the position
worth P(r)(1 + r)^t against the promise on a log axis, with the crossing; the
money at maturity in three parts) → the D/T rule (`RuleFigure`: what we earn
against the new rate for four bonds, the rule as the tangent at the yield) →
costs.

## The identities

- At an unchanged yield, every year's return is the yield whatever the coupon:
  P_t (1 + y) = C + P_{t+1}.
- Held to maturity, coupons reinvested at a new rate r set just after buying,
  the money at maturity is W_T = P(r)(1 + r)^T, so what we earn a year is
  (1 + r)(P(r)/P(y))^(1/T) − 1.
- To first order that is y + (1 − D/T)(r − y), D the Macaulay duration: the
  price jumps by about D points per point at once, the reinvestment loses a
  point a year for T years, net T − D.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| The yield is the return if held to maturity, provided coupons are reinvested at it | Right, and the proviso carries most of the money: on a 30-year 8% bond, $666 of the $1,006 at maturity (two thirds) is interest on coupons (a sixth at 10 years, nearly all at 100). Rates to 4% the day after buying: 5.84% a year, not 8% |
| A premium bond loses money as it pulls to par | At an unchanged yield every bond earns its yield every year; the 8% coupon at 4% (price $132.44, current yield 6.04%) earns 4.00% exactly |
| (found) | The yield survives on a share D/T of the life: 41% for the 30-year bond (rule 5.62%, exact 5.84%; at 12%: 10.38% vs 10.56%), 72% at 10 years (6.96%), 100% for a zero (8% whatever happens), 13% at 100 years (4.71%). The exact curve is convex and lies above the rule |
| (bridge) | The promise and the real position cross after about 14 years (D = 12.2): the subject of `duration-and-convexity` |

## Numbers on the page

`verify/check-numbers.mjs` (57): both identities on 4,000 random bonds to
1e-12, the money at maturity summed coupon by coupon, the yield inverted from
the price, Macaulay duration against the numerical slope of the log price,
every prose number. `verify/check-browser.mjs` (86 at 390/1280): the blue bars
summing to the price, each year's coupon and price change meeting the 4% line,
the price lines' ends, the worth lines' ends and crossing on a log axis, the
interest share of the bars at 10 years, the rule tangent at the yield and below
the curve, a zero's flat line.
