# Population Stability Index — build notes

Longest article in the project: 14 content components, 120 numeric checks, 60-odd
browser checks, and a precompute that takes a minute. What follows is the part
worth carrying to the next one.

## The thing that made the article work

Finding a claim that could be **proved on screen**. Under no drift,
`(1/N + 1/M)⁻¹ · PSI` is chi-square with `B−1` degrees of freedom — so the
centrepiece is 35,000 simulated monitoring months drawn as a histogram with the
chi-square density laid over it and **nothing fitted**: simulated mean 9.009
against a theoretical 9, sd 4.248 against 4.243, tail rate 5.09% against 5%.
Everything else in the article hangs off that one picture. The result is
Yurdakul & Naranjo (2020) Theorem 3.3; the contribution here is a picture and
one subtraction, and the article says so.

The second identity was found by probing rather than planned: PSI's *quadratic*
part — the Pearson statistic, the part the chi-square law is about — is
**identical to eight decimals** for the two halves of a mirror pair, so the
entire difference between the two readings is the cubic term and beyond. That
turned "PSI has no sign" from a complaint into a decomposition.

**Look for the identity in pass 1.** Both came out of throwaway node probes run
before any component existed, and both changed what the article was about.

## Data design is where the argument gets won

Four channels of one lender, one month, one scorecard, and the volumes are the
whole point: 44,000 / 9,300 / 2,600 / 180. Two of the four populations did not
move at all, and *the same truth reads 0.0014 at one of them and 0.0505 at the
other*. That single comparison — identical populations, factor of 35 — is worth
more than any amount of argument about tuning.

The domain choice did real work too. Because the score has a **cut-off** at 640
and a **calibration** (odds double every 40 points), every PSI can be translated
into approval rate and into bad loans per thousand, which is what makes the
thresholds legible: 0.10 turns out to be 25.5 score points, a third of a
standard deviation, and **eleven points of approval rate**. A reader cannot
argue with 0.10; they can argue with eleven points.

Being fair to PSI got its own section and it is the best section. It needs no
outcomes — the first honest backtest of a scorecard lands 18 to 30 months after
launch — it decomposes by bin, and it estimates a real population quantity,
which is the only reason the correction has anything to correct toward.

## What the checks caught

Four claims, and the article is better for each.

- **An asymmetry that was one lucky draw.** A first probe found that swapping
  which sample defines the bins changed a small window's reading by 70%. Over
  250 replications the two directions agree in expectation on all four
  channels. The whole section was rebuilt around the asymmetry that *is* real —
  emptying a bin costs more than filling it — and the dead claim is now a check
  so it cannot creep back.
- **The corrected reading was compared to the wrong target, twice.** With a
  fixed development sample the raw reading converges to `psi(a, e)`, and
  subtracting the full floor removes the frozen half too, so the target is
  `psi(a, e) − (B−1)/M`. Getting that right produced the article's best
  secondary finding: below ~40 applications per bin the correction leaves
  residue, by **exactly** the gap between the real floor and the chi-square
  formula — the validity table of the previous section arriving again in a
  different costume.
- **The Conclusion claimed all four channels stayed green all year.** The
  180-application panel reaches 0.100 in month 8 of 24. The sentence is now
  "about one month in twenty-two, on nothing at all", which is better.
- **The closing pack claimed the verdict column "does not flicker".** It
  flickers at exactly the rate a 5% test should — 4.2% and 5.0% on the two
  channels that did not move, 100% and 63% on the two that did. Printing all
  four numbers is a far stronger ending than claiming the fix is perfect.

## What only the pictures caught

- **The lab's readout rounding turned a subtraction into an error.** Three
  decimals rendered `0.0047 − 0.0045 = 0.0002` as `0.005 − 0.005 = 0.0002`.
  Every assertion passed; it just read as broken arithmetic. **Any readout that
  shows `a − b = c` needs enough digits for the arithmetic to check out on
  screen**, regardless of what precision the number deserves on its own.
- **A caption said "60,000 months" after the simulation was retuned to 35,000.**
  The classic hard-coded number. It is now `{int(ov.reps)}`, from the data.
- **A curve ran 105px off the top of its own box.** `(r−1)ln r` reaches 4.16 at
  r = 4 on a y-axis scaled to 2.4. The outer `<svg>` clipped it, so it looked
  perfect — only "nothing drawn outside its own svg" found it. **When a curve
  and its y-domain are chosen separately, one of them is wrong.**
- **Two zone labels collided on a phone.** An `<svg><text>` neither wraps nor
  shrinks, so each label is now dropped when its own band is narrower than the
  words.

## A log axis was the only honest choice, and it changed a sentence

The quantities in the lab run from 0.0002 to 0.5 — three and a half orders of
magnitude — so the PSI axis is logarithmic. That immediately falsified a
sentence: the null band does **not** shrink as N grows, it *slides*, because the
null distribution is the same shape at every sample size and only its scale
moves. The browser check that asserted the pixel width was wrong about the
article, not about the page. The replacement pair — width in PSI units
collapses, width in pixels does not — is now one of the better checks in the
file, and the fact earned its own paragraph.

## Two things worth stealing

- **Exact integrals instead of simulation wherever a closed form exists.** Every
  population quantity here — bin masses, approval rates, bad rates, AUC — is a
  quadrature against the generating mixture, so the scatter of PSI against
  damage has *no sampling noise in it at all*: what you see is the relationship
  rather than an estimate of it. Only the genuinely stochastic parts are
  simulated, which is most of the article, because sampling is its subject.
- **An exact binomial sampler, deliberately.** The article's central claim is
  about a sampling distribution, so the simulation that draws that distribution
  cannot use a normal approximation to the multinomial — it would be assuming
  the answer. Devroye's beta recursion is fifteen lines and exact at any n; the
  checks verify it against the closed-form pmf.

## Small things

- **`device_bash` caps at 120 seconds** and background processes do not survive
  the call, `setsid` included. `check-numbers.mjs` re-runs the whole precompute
  as its first check, so the precompute has to stay under ~70s for the check to
  fit. Profiling it (print *durations*, not start times) found 24s in a table no
  component imported any more.
- **`npm install` fails on this VM** — the registry is blocked. Copying
  `node_modules/` from the previous article is instant and works; the
  `@fontsource` dev-dependencies are only needed to source the woff2 files,
  which the scaffold already copies.
- `.pack` was used as a class by two different components (a div and a table),
  which made every Playwright locator a strict-mode violation. **Grep the new
  components for a class name before reusing it.**
- KaTeX draws its own SVGs with deliberately overflowing internal geometry;
  every DOM sweep in `check-browser.mjs` has to skip `.katex` or it reports
  paths 8,000px wide.
- Quantile edges put exactly `M/B` observations per bin only when `B` divides
  `M`. With M = 50,000 the article's B = 10 is exact and B ∈ {3, 6, 12, 15, 30,
  75} is off by one observation. The check asserts both halves rather than the
  convenient one.

## Where this leaves the repo

`articles/population-stability-index/` is the newest reference article: both
check files, `verify/ship.sh`, a `scripts/precompute.mjs` with a deep-diff
freshness check, and a `src/chart.js` of scale/tick/path helpers that fourteen
figures share and that no other article has yet. It is in `site/articles.json`
and `./scripts/build-site.sh` has been run, so `site/` is assembled and ready to
commit — that commit has **not** been made.
