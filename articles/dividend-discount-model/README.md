# dividend-discount-model (Fm7)

Finance row 8, `finance/markets`. Built 26 September 2026 in the cloud container.
Needs `discount-rates` (Mi19, not yet built): the article explains discounting
in one paragraph so it stands alone.

**Kind:** result (closed forms of a growing perpetuity). **Shape:** derive →
stream lab → curve with tangent → two-stage lab. **Hook:** `StreamLab`.

## Claim as built

Priced as a growing stream, a share is worth D1/(r − g), and the gap r − g does
three jobs: it is the dividend yield, the inverse of the price per dollar of
dividend, and the inverse of the duration. At r = 8%, g = 5% the share has a
33-year duration (36-year Macaulay), half its value arrives after year 24.6 and
75.4% after year 10; a one-point rise in r takes a quarter off the price while
duration's straight line says a third, and a one-point fall adds half. A 12%/10
year then 4% two-stage stream at 8% has 75% of its value in the terminal value
(64% even with a 20-year forecast).

## What pass 1 moved

- "Only the gap matters" is true of the price but **not** of the timing: 10%/7%
  gives the same $33.33 but a half-way year of 25.1, not 24.6, because timing
  runs on the ratio (1+g)/(1+r). The first draft said 23.8 (wrong direction);
  the check caught it and the page now says 25.1.
- The first draft credited Campbell and Shiller (1988) with the finding that
  dividend-yield movements are mostly discount-rate news. They built the tool;
  the finding is summed up in Cochrane (2011). Now cited that way.
- "Stretch the forecast to 20 years and the terminal value still carries more
  than half" became the number, 64%.

## Numbers on the page

$33.33 at 8%/5% (and at 10%/7%, 5%/2%); yield 3%; each year 97% of the last;
75.4% after year 10; half-way 24.6; g = 6.5% doubles the price to $67 with
half-way about year 50; duration 33.3 and Macaulay 36; +1 point −25% (tangent
−33%), −1 point +50%; 6% gap −14%, 2% gap −33%; gap 2% vs 4% is $50 vs $25;
two-stage 75% and 64%. 35 number checks (closed forms against year-by-year
summation over 20,000 years), 54 browser checks including the cumulative line
crossing 50% at the drawn half-way marker and the tangent passing through the
current point.

## Sources

Williams (1938); Gordon (1959); Campbell & Shiller (1988); Cochrane (2011);
Dechow, Sloan & Soliman (2004); Damodaran (2012).

## Built

Ported onto the house scaffold on 27 September 2026 from the cloud build of 26 September: page furniture from cost-curves, the house palette (three categorical colours, ink for the fourth mark, a violet ramp for families), a viewBox on every chart, and the common block of check-browser.mjs. The numbers module and its checks are unchanged.
