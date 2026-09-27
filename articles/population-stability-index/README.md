# Population Stability Index

An application scorecard at a consumer lender, watched for one month across
four acquisition channels. The score is on the usual banking scale, the odds of
default double every 40 points, and the monitoring pack computes the same PSI
for a channel that wrote 44,000 applications and one that wrote 180.

- **Shape**: question first, then a lab, then the theorem, then its
  consequences. The article opens on a monitoring pack the reader is asked to
  rank and cannot, because the ranking is mostly reporting sample size.
- **Hook**: `MonitorLab` — one slider for how far the population really moved,
  one for how many accounts the month happened to have, and a resample button.
  The reading and the noise band move independently, which is the whole article.
- **Closest structural analog**: `f1-score`. Both articles take a number
  everyone reports, show it is answering a different question from the one it
  is asked, and end with what it is actually for.

## The standard telling, written down flatly enough to be wrong

1. PSI measures how far a population has moved from the one the model was built
   on: `PSI = sum (actual - expected) * ln(actual / expected)` over bins,
   usually the deciles of the development sample.
2. Below 0.10 there is no significant change; 0.10 to 0.25 is a moderate shift
   worth investigating; above 0.25 the population has changed significantly and
   the model should be reviewed or rebuilt.
3. Ten bins is the convention, and the bin count is a presentation detail.
4. An empty bin is patched by substituting a small constant, which is a numerical
   nuisance and not a modelling choice.
5. PSI is symmetric — the formula is symmetric in `actual` and `expected`.
6. PSI is the workhorse of ongoing monitoring because it needs no outcomes: it
   is available the day the data lands, years before a default is observed.

## What the probes found

Everything below is re-derived in `verify/check-numbers.mjs` from the same
modules the page imports. Population quantities (bin masses, approval rates,
AUC, bad rates) are exact integrals against the generating mixture, not
estimates; only the sampling quantities are simulated, because sampling is the
subject.

**2 is the important one, and it is wrong in both directions at once.**
PSI has a noise floor. Under no drift at all, the scaled statistic
`(1/N + 1/M)^-1 * PSI` is chi-square with `B-1` degrees of freedom — measured
mean 9.0004 against a theoretical 9 at `B = 10, N = 44,000, M = 50,000`, tail
rate 0.0493 against 0.05 — so

    E[PSI | nothing moved]  =  (B-1) * (1/N + 1/M)

That is a bias, not a variance: every term of PSI is non-negative, so sampling
noise can only add. Consequences, both measured:

- **Small N: the thresholds fire on nothing.** At `N = 100` a population that
  did not move reads 0.096 on average and crosses 0.10 in 39.5% of months. At
  `N = 50` it reads 0.226 and crosses *0.25* — "significant change, rebuild" —
  in 28% of months. The 0.10 line is an exactly calibrated 5% test at one
  sample size and one only: `N = 170` with ten bins. The 0.25 line is one at
  `N = 68`.
- **Large N: the thresholds see nothing.** Because the threshold is fixed, the
  shift it can detect does not shrink with data. The location shift giving 80%
  power at 0.10 is 24.96 points at `N = 200`, 26.52 at `N = 1,000`, 25.74 at
  `N = 44,000` and 25.52 at a million: flat. The sample-size-aware critical
  value falls from 22.4 points to 1.6 over the same range.
- **The thresholds are effect sizes in disguise.** On this population 0.10 is a
  25.5-point shift (0.314 sd) and 0.25 is a 39.9-point shift (0.492 sd). Those
  are not subtle movements.

**The four-channel pack is the whole argument in one table.** Expected readings,
against a 50,000-application development sample and ten bins:

| channel | N | E[raw PSI] | floor | E[corrected] | what actually happened |
|---|---|---|---|---|---|
| Online direct | 44,000 | 0.0343 | 0.0004 | **0.0339** | thin-file share 37% -> 52%; approval rate 66.6% -> 58.2%, i.e. 3,690 fewer approvals |
| Branch | 9,300 | 0.0014 | 0.0012 | 0.0003 | nothing |
| Motor dealer | 2,600 | 0.0085 | 0.0036 | 0.0049 | a 6-point drift down |
| Broker | 180 | **0.0502** | 0.0502 | 0.0003 | nothing |

All four are green. The highest reading in the pack belongs to the channel that
did not move — it beats Online in 74.0% of months, and about once every 22
months it crosses 0.10 on nothing at all — and the identical truth ("nothing
moved") reads 0.0014 at Branch and 0.0505 at Broker, a factor of 35 apart.
Subtracting the floor recovers the right ordering exactly.

The closing section does **not** claim the corrected column is then always
right, because it is not: compared against its own no-drift band at 5%, Online
is flagged in 100% of months, Motor dealer in 63%, and the two that did not move
in 4.2% and 5.0%. Those last two are the size of the test, they are the same at
180 applications as at 9,300, and stating them is the whole difference between a
statistic and a colour.

**3 is false and the bin count is worth a factor of fourteen.** On the Motor
dealer channel, the raw reading runs 0.0033 at `B = 2` to 0.0461 at `B = 100` —
same data, same shift — while the corrected reading moves by 2.1. Merging two
adjacent bins never increases PSI (46,187 merges over random pairs, zero
violations), so refining can only push it up, and what it pushes up is mostly
floor. Two corrections the checks forced, both of which improved the article:

- Quantile bins at two different `B` are **not nested**, so nothing forces the
  true divergence to rise with `B`, and it does not — 0.00487 at six bins,
  0.00480 at eight. The data-processing inequality is about refinement, and the
  article now says that and demonstrates it on a chain that really is nested
  (64 quantile bins merged two at a time down to 2: strictly increasing).
- With 80+ applications per bin the corrected reading is within 2.5% of what it
  estimates. Below about 40 it reads **high**, by exactly the gap between the
  real floor and the chi-square formula — 1.20× at `B = 100`, where there are 26
  applications per bin. That is the validity table of the previous section
  arriving again in a different costume, and it is a reason to keep the bin
  count modest that has nothing to do with the size of the raw number.

**4 is a modelling choice wearing a numerical disguise — and the measurement
moved the section.** One empty bin out of twenty at `N = 300`: eps = 1e-2 gives
PSI 0.176, the common 1e-4 gives 0.421, 1e-8 gives 0.882, and merging the bin
into its neighbour gives 0.202. But the probe also showed that on a continuous
score with quantile bins this **barely ever happens**: at ten bins the chance of
an empty one is under 0.3% at every sample size tried, even with a twenty-point
shift, and it takes fifty bins on 300 applications to reach 29%. The article says
so rather than implying otherwise, and moves the section to where the zero is
structural instead of unlucky — the characteristic-level version, on categories.
There, a level that did not exist at development time has an expected
proportion of exactly zero, which no substitution on the actual side can repair:
a single new residential-status code holding 1.5% of applications, with nothing
else about the characteristic changed at all, scores 0.0023, 0.0749 or 0.2135
depending on the epsilon, and 0.0159 if it is folded into "other" and the pack
says so.

**5 survived, and the thing that replaced it is better.** A first pass found
that swapping which sample defines the bins changed the Broker reading by 70% —
and that turned out to be one draw. Averaged over 250 replications the two
directions agree in expectation on all four channels, within 3.5%; on a small
window they differ by a factor of four between the 5th and 95th percentile of
the ratio, which is the same small-sample noise the rest of the article is
about. The claim is now a check that keeps the wrong version from creeping back.

The asymmetry that is real is in the *direction* of a shift, and it is exact.
Take the mirror pair: the thin-file share moving to 22% and to 52% shifts every
bin by the same mass in opposite directions (measured antisymmetry 1.1e-16) and
moves the approval rate by exactly ∓8.387 points. The Pearson part of PSI is
then identical for the two to eight decimals — 0.03883822 both ways — so the
whole difference in the readings, 0.0469 against 0.0339, is the cubic term and
beyond. What that term says: **move the same mass out of a bin as into it and
the move out costs more** — 1.71× at a decile that loses or gains half its
share, 2.74× at 80%. PSI therefore calls a channel that improved by 8.4 points
of approval rate a bigger problem than one that deteriorated by the same 8.4.

Separately and exactly: a bin holding `r` times its expected share costs exactly
`r` times what a bin holding `1/r` of it costs, since
`(r-1)ln r = r * (1/r - 1)ln(1/r)`.

**6 is true, and it is the only thing in this list that is.** It is also the
reason PSI's blindnesses matter:

- **Within a bin, PSI sees nothing at all.** The 640 cutoff sits inside decile
  4, `[630.2, 654.4)`. A broker that learns where the cutoff is and nudges 35%
  of that bin's sub-cutoff mass across it changes no decile count: PSI is
  exactly 0, the approval rate rises 1.33 points and the accepted bad rate
  rises 3.7%.
- **Concept drift is invisible by construction.** Move the calibration 40
  points and leave the histogram untouched: PSI = 0, bad loans per 1,000
  applications go from 6.81 to 13.41, and AUC moves only 0.8481 to 0.8408 —
  so the rank-order check does not catch it either. Only observed-against-
  expected by band does.
- **The same PSI is consistent with opposite business outcomes.** The
  thin-file share moving 37% -> 52% and 37% -> 22% change the approval rate by
  exactly -8.387 and +8.387 points. PSI calls the improvement worse: 0.0469
  against 0.0339.

## The chi-square approximation's own limits

It is the theorem the article rests on, so where it fails is stated in the
article rather than hidden. `E[(1/N + 1/M)^-1 PSI] / (B-1)` against observations
per bin: 1.76 at 4, 1.067 at 10, 1.025 at 20, 1.014 at 30, 1.005 at 100,
1.0005 at 1,000. Below about twenty observations per bin the floor formula
*understates* the floor, which makes the case against the fixed thresholds
stronger rather than weaker. The lab and the figures draw a simulated band
below that point.

## What this article does not claim

PSI is not useless and the article says so at length. It needs no outcomes,
which is decisive when a default takes two years to observe; it decomposes by
bin, which localises a shift; and it is a consistent estimate of a real
population quantity, the Kullback-Leibler divergence `J`, to which the
correction restores it. The failure is the threshold, not the statistic.

## Where the checks changed the article

Four times, and the article is better each time. (1) The bins-from-which-side
asymmetry was one lucky draw and is now a check against its own return.
(2) The corrected reading was being compared to the wrong target twice before
the right one — `psi(a, e) - (B-1)/M` — was identified, which also produced the
per-bin limit above. (3) The Conclusion claimed all four channels stayed green
all year; the 180-application panel reaches 0.100 in month 8 of 24, so the
sentence now says once in twenty-two months instead. (4) The closing pack
claimed the verdict column "does not flicker"; it flickers at exactly the rate a
5% test should, and saying so is a better ending.

Two things only the screenshots caught: the lab's readout rounding turned
`0.0047 - 0.0045 = 0.0002` into `0.005 - 0.005 = 0.0002`, which reads as an
arithmetic error; and the overlay figure's caption said "60,000 months" after
the simulation had been retuned to 35,000, which is exactly the hard-coded
number this project keeps finding.

## Prior work

The chi-square result is Yurdakul & Naranjo (2020), Theorem 3.3. The 0.10/0.25
thresholds are attributed to Lewis (1994). Potgieter et al. (2025) make the
same sample-size argument and propose a different statistic. This article's
contribution is a picture and one subtraction, not a theorem.
