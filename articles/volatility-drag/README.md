# volatility-drag (Fr1)

Finance row 4, `finance/portfolios`. Built 26 September 2026 in the cloud
container. Needs `compound-growth` (Ma4, published).

**Kind:** result (a pathwise identity, exact in continuous time).
**Shape:** smallest case (two days) → zigzag figure → rule → lab where the reader
sets the rule's two inputs → region map → parabola. **Hook:** `PathLab`.

## Claim as built

A daily-reset L× fund ends at index^L × exp(−(L² − L)/2 × realised variance),
so its result depends only on the index's return and its realised variance. The
first factor compounds in the fund's favour in a trend; the second is the drag.
The coefficient (L² − L)/2 is symmetric about L = ½, so −1× bleeds like +2×,
−2× like +3×, and −3× twice as fast as +3×. A flat year at 20% volatility costs
a 3× fund about 11% and a −3× fund about 21%; a +30% year at 15% volatility
gives the 3× fund about 105% against 90% for "three times".

## What pass 1 moved

- The slate called the rule exact. With **daily** resets it drops cubes and
  higher powers of each day's return, so the page says "≈" and quantifies it:
  95% of simulated flat years within 0.1 points at 20% volatility, within about
  a point at 60%. It becomes exact under continuous rebalancing (Avellaneda and
  Zhang 2010); the checks show that limit numerically.
- The first draft said a ±10% pair costs the fund "less than nine times" the
  index's loss. Wrong: it is nine (L²x²), of which three are L times the index's
  own loss and six are drag. Rewritten that way.
- The order of days doesn't matter at all (products commute), which is why the
  lab can redraw the path freely while keeping the two numbers.
- In a symmetric zigzag the +3× and −3× funds are identical pair by pair,
  (1 + 3x)(1 − 3x), a nice concrete case of the parabola's symmetry.

## Numbers on the page

| Statement | Value |
|---|---|
| +10%/−10% | index 0.99, 3× fund 0.91: nine times the loss, 3 + 6 points |
| ±2% zigzag, 60 days | index −1.2%, 3× and −3× both −10.3% |
| lab opening, flat year at 20% (seed 7) | fund −10.4%, rule −10.4% (0.05 pts apart) |
| flat year, 3× | −11% at 20% vol, −38% at 40% |
| flat year, 2× | −4% at 20%, −15% at 40% |
| flat year, −3× | −21% at 20% |
| trend +30% at 15% vol, 3× | +105% vs 90% |

43 number checks (module against products written out), 42 browser checks
including the fund path ending on the rule's circle in pixels and the lab's dot
landing inside or outside the red wedge.

## Sources

Avellaneda & Zhang (2010); Cheng & Madhavan (2009); FINRA Regulatory Notice
09-31 and the SEC/FINRA investor alert (2009).

## Built

Ported onto the house scaffold on 27 September 2026 from the cloud build of 26 September: page furniture from cost-curves, the house palette (three categorical colours, ink for the fourth mark, a violet ramp for families), a viewBox on every chart, and the common block of check-browser.mjs. The numbers module and its checks are unchanged.
