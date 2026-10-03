# npv-vs-irr (Fm10)

Finance row 11, `finance/markets`. Built 3 October 2026. Needs Fm7
(`dividend-discount-model`). The slate allowed a merge into Fm7; pass 1 found
a claim of its own (Hazen's identity), so it stands alone.

**Kind:** result (Hazen 2003: for any IRR k of a project, NPV(r) = (k − r) ×
Σ C_t/(1 + r)^(t+1), where C_t is the balance of an account that earns k and
pays out the project's cash flows). **Shape:** question first (guess card: Quick
at 50% or Slow at 24.6%, at a 10% cost of capital) → two scores for one project
→ heights and areas (the identity in two displays) → lab (`RateLab`: NPV
profiles above, the rectangles below, a pair toggle) → does the IRR assume
reinvestment? (`ReinvestFigure`) → a project with two IRRs (`MineFigure`).
**Hook:** `RateLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Choose the project with the higher IRR | Quick (−100, +150): IRR 50%, NPV $36.36 at 10%. Slow (−100, +300 in year 5): 24.6%, $86.28. As rectangles: 90.9 dollar-years × 40 points against 592.0 × 14.6 |
| The rankings flip at a crossover rate | At 18.9%, the IRR of the difference (−150 in year 1, +300 in year 5), where the areas match. Small and Large (−100/+150, −1,000/+1,300) flip at 27.8% |
| The IRR assumes reinvestment at the IRR | The IRR is a property of the cash flows. Quick's $150 grows to $219.62 at 10% by year 5 and matches Slow's $300 only at 18.9%, the crossover rate again |
| Accept when the IRR beats the cost of capital | Not with two IRRs: the mine (−100, +520, −480) has IRRs of 20% and 300% and loses $23.97 at 10%. Run as an account at 20%, it is −$400 after a year, so it lends to us: −239.67 dollar-years × +10 points; at 300%, −8.26 × +290; both −$23.97. Worth digging only between the two; peak $40.83 near 84.6% |
| (costs) A fund's IRR measures its return | A year on a 3% credit line lifts the IRR from 14.9% to 18.0% while the multiple falls from 2.00 to 1.94 and the NPV at 3% doesn't move. $100, −$250, +$200 has no IRR at all |

## Numbers on the page

`verify/check-numbers.mjs` (52 checks): the identity at every rate for every
project and both of the mine's roots, and for 300 random projects; the crossover
as the IRR of the difference and as equal areas; the reinvestment break-even;
the chart windows. `verify/check-browser.mjs` (74 at 390 and 1280 px): each
rectangle's drawn area equals its NPV readout (read back through the axes), the
IRR dots on the zero line, the crossover dot on both curves, a rectangle below
zero past its IRR, the bars level at 19%.

## Sources

Hazen (2003); Magni (2010); Lorie & Savage (1955); Fisher (1930); Brealey,
Myers & Allen.
