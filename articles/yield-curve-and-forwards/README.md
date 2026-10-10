# yield-curve-and-forwards (Fm13)

Finance row 28, `finance/markets`, Stage 5. Built 10 October 2026. Needs
Fm12 (`duration-and-convexity`: the duration weights and the price of
convexity).

**Kind:** concept + model (Vasicek 1977; Cox, Ingersoll and Ross 1981; Fama
and Bliss 1987 quoted). Exact sums and closed forms, no data. **Shape:**
build-up: bootstrapping as a short steered run (`BootLab`: five bonds, one
press per maturity, the step written out; a price-error slider) → a yield is
an average of spot rates (`CouponFigure`: the ten-year bond's yield against
the spot curve, weights as bars) → forward rates as break-evens
(`BreakEvenFigure`) → question first for the second half (investors expect 4%
for ever and ask no premium: is the 30-year forward above, below or at 4%?) →
the hook (`ForecastLab`: expected rate, forward rate and yield with the
premium and convexity shaded; volatility and premium sliders) → what the data
say (quoted) → costs.

## The model

Planted spot curve s(t) = 4.5% − 2.5%·e^(−t/4), annual compounding; five
bonds (1–5 years, coupons 2% to 4%) priced off it. Vasicek with r0 = θ = 4%,
κ = 0.1: f(T) = E[r_T] + π(1 − e^(−κT)) − σ²/(2κ²)(1 − e^(−κT))², continuous
compounding.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Bootstrap the spot curve from coupon bonds | Exact: 2.55, 2.98, 3.32, 3.58, 3.78%. Each bond's yield sits below its spot (3.74 vs 3.78 at 5 years). A 25-cent error in the 3-year price moves s₃ by 0.09 points and the forwards either side about three times as far in opposite directions (3.99 → 3.72, 4.37 → 4.66) |
| A curve of yields to maturity is the yield curve | Yields are duration-weighted averages of spot rates (rule 4.151% vs exact 4.152% for a 10% ten-year bond; zero 4.295%): the coupon effect |
| Forwards are implied by spots | As break-evens: $106.06 either way at 3.42% (forward for year 2); spots are compounded averages of forwards, so forwards sit above a rising spot curve (4.60% vs 3.78% at year 5) |
| Forwards are the market's forecast (expectations hypothesis) | No premium and σ = 1 point: the 30-year forward is 3.55%, 0.45 below the expected 4% (convexity, ∝ σ²: 1.02 at 1.5 points); a premium of 0.5 lifts it to 4.02% with a hump. Checked against Vasicek's bond price and 20,000 simulated short-rate paths. CIR (1981): the versions can't all hold |
| (data, quoted) | Fama–Bliss: forward spreads predict excess returns about one for one, R² about 18% (Cochrane–Piazzesi 2005) |

## Numbers on the page

`verify/check-numbers.mjs` (49): the bootstrap against the planted curve, the
forward identity, the price error, the yield rule on three curves, the
break-even, the forward formula against the closed-form log price, the yield
as the average of forwards, a Monte Carlo of the short rate; every prose
number. `verify/check-browser.mjs` (80 at 390/1280): the dots and steps read
back through the axis, the first two dots fixed under the error, the weights
summing to 100%, the circle on both lines, the forward line on the
expectation at zero volatility and humped with a premium.
