# fat-tails (Fr11 📊)

Finance row 21, `finance/portfolios`. Built 4 October 2026.

**Kind:** empirical + result. French's daily market file (202608 vintage),
pinned in `data/` (see `data/SOURCES.md`), and seeded Student t samples.
**Shape:** case first (19 October 1987: −17.4%, 16.2 sd; the normal's wait
1.7 × 10⁵⁶ years) → counting the big days (`CountLab`, the hook: a log
histogram with a threshold) → the tails on a log–log chart (`TailFigure`,
Hill's fit) → what an exponent of 3 does to kurtosis (`KurtosisLab`:
simulated t samples, and the US by window with the biggest day's slice) →
costs. **Hook:** `CountLab`.

## Claims and verdicts

| Received claim | Verdict |
|---|---|
| Moves the normal puts once in thousands of years turn up every few years | Stronger: 101 days beyond 5 sd (51 falls, 50 rises) in 100 years, about one a year, where the normal waits 6,639 years; 9 beyond 10 sd (normal: 2.5 × 10²⁰ years) |
| Returns are "leptokurtic" | Yes, in a particular shape: 1.4–1.6 × the normal's days in the middle, about half between 1 and 2.5 sd, and far more beyond 3 |
| Tails follow a power law, exponent about 3 (Gopikrishnan et al.) | Hill through the 200 largest: 3.1 for falls and for rises (3.9 at 50 days, 2.7 at 800). Beyond 10 sd is 11 times rarer than beyond 5; the normal says 4 × 10¹⁶ |
| Kurtosis measures fat tails | With α ≈ 3 the fourth moment doesn't exist, so a sample's kurtosis has no value to settle at. Student t, ν = 3: about 15 at 1,000 days, roughly doubling per tenfold (10^(1/3) = 2.15), around 70 at 100,000; ν = 6 settles at 6. US: 19.1 over the century, 5.2 in 1977–86, 73.3 in 1987–96 with 84% from 19 October 1987 |
| Normal risk measures understate tail risk | At the normal's 1% line the data have 1.87%, at 0.1% they have 0.83% (8×), but at 5% only 4.1% |

## Numbers on the page

`verify/check-numbers.mjs` (60 checks): the pinned file's hash, a fresh
`build-data` run, an independent parse, `src/precomputed.js` fresh; Hill's
estimator on an exact power law; a large t₃ sample's tail exponent; the
medians of many t samples (ranges, since the statistic is very skewed); the
pink slice equal to the day's own fourth power. `verify/check-browser.mjs`
(80 at 390 and 1280 px): every bin's top read back on the log axis, the pink
bins holding the 101 days, the normal's peak, Hill's anchor and slope read
back through both log axes, the US line reaching 1987, the t₆ samples ending at
the dashed 6, the 1987 bar's slice.

## Precompute and seeds

`scripts/precompute.mjs` writes the running kurtosis of the eight drawn t
samples (seeds 11–14 for ν = 3, 21–24 for ν = 6) on a 121-point log grid;
the check re-runs it. The four ν = 3 samples end with a median within a factor
of 1.6 of the typical value.
