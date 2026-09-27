# `price-indices`

**Kind** model · **Shape** assumption lab, with the unobservable (σ) on the slider ·
**Hook** `BasketLab` · **Stack** Svelte 5 + Vite

Pass-1 spec: `claude/price-indices-pass1-spec.md` in the project.
Row 15 (Ma2) of `economics-curriculum-slate.md`.

## The angle

A fixed basket overstates how much more it costs to live as well as before, by
about ½σ times the variance of the log price changes: nothing when prices move
together, quadratic in how far apart they move, and proportional to an
elasticity nobody observes. Yet the Fisher index, built only from the two baskets
actually bought, lands on the true index for every σ at once.

## The model

Two goods: energy (20% of the base budget) and everything else. Base prices are
1; energy's price is multiplied by R. The household is CES with elasticity σ.
`src/indices.js` computes the true index from σ (the household) and every index
formula from prices and baskets only (the statistician).
`verify/check-numbers.mjs` re-derives the true index by a second route: the CES
utility function and a golden-section minimisation of the cost of reaching last
year's indifference curve.

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | A fixed basket overstates the cost of living | **True, by a square law**: energy doubling, 20% vs true 17.3% (σ = 0.5), 14.9% (σ = 1), 11.1% (σ = 2); log gap ≈ ½σ·w(1−w)(ln R)², slope 2 on log–log axes; zero whenever every price moves by the same factor |
| 2 | Paasche understates; the truth lies between | **True for this household** (homothetic), over the lab's whole range; 11.1% at σ = 1 |
| 3 | The true index needs preferences you can't observe | **False in practice**: Fisher 15.5% vs 14.9% for a doubling (88% of the gap closed), 4.58% vs 4.56% for +25% (96%); error slope 3; about 100× smaller than the fixed basket's for a 5% shock at σ = 1; exact at σ = 0 |
| 4 | Chaining fixes substitution bias | **On a smooth path**: 12 monthly steps to a doubling, chained fixed basket 15.2%, chained Fisher within 0.005 points of 14.9%. **Not on a bouncing path**: a good 25% off every other month, chained fixed basket +17.2% and chained Paasche −14.7% after 24 months while the truth is 1; chained Fisher equals the truth at every even month (time reversal) |

## Layout

| Section | Component |
|---|---|
| the question | `GuessFigure` — a guess, then the four households' answers |
| the hook | `BasketLab` — R and σ; indifference curve, A, B, the two parallel lines; four bars |
| the square law | `SquareLawFigure` — log–log gaps, σ family on the violet ramp, Fisher dashed; a scrubber |
| chaining | `ChainFigure` — smooth rise vs sale path, σ pills, chained L, P, F and the truth |

## Verification

- `npm run check` — **27 checks**, including the direct-minimisation route to
  the true index (agrees to 1e-7, the golden-section floor), both slopes, the
  bracket over the lab's range, and time reversal.
- `verify/check-browser.mjs` — **82 checks** at 390px and 1280px. In rendered
  pixels, at four settings of R and σ: A and B lie on the indifference curve, A
  on the fixed-basket line, B on the true line, the lines are parallel, and the
  true line never crosses the curve. The square-law markers sit on their
  curves; chained Fisher sits on the truth at all 13 even months.

## Sources

Diewert (1976), J. Econometrics 4(2):115–145; Boskin Commission (1996) via GAO
GGD-00-50; Ivancic, Diewert & Fox (2011), J. Econometrics 161(1):24–35; BLS,
"Introducing the Chained Consumer Price Index". Nothing reproduced.
