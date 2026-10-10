# Verifying an article

Read this before writing the checks, and again before calling an article done.

The class of error to hunt is **not** broken code. It is a mismatch between
what the prose claims and what the chart beside it shows. That survives every
code review, and it is what these two files exist to catch.

## The quantity on the chart must be the quantity the claim is about

Three ways this project has broken that rule. The general form is worth holding in
one piece, because each one looked like a different bug at the time.

- **In-sample cannot support out-of-sample.** The `xgboost` learning-rate section
  told a story about shrinkage from training error, where less shrinkage always
  wins and more rounds always help. Anything about overfitting, regularisation or
  early stopping needs held-out data on the chart.
- **A simulated world cannot support a claim about the real one.** These articles
  generate from a known truth, which is what makes the checks strong — and it also
  means a sentence about what happens in practice is not something the simulation
  established. Be explicit about which of the two you are claiming.
- **One draw cannot support a claim about a distribution.** A first PSI probe
  found that swapping which sample defines the bins moved a small window's reading
  by 70%. Over 250 replications the two directions agree in expectation on all
  four channels: the effect was one lucky draw, a whole section had been built on
  it, and it had to be rebuilt around the asymmetry that is real — emptying a bin
  costs more than filling it. Replicate before believing an effect, and turn the
  dead claim into a check so it cannot creep back.
- **A path compounded the wrong way can contradict the claim it illustrates.**
  `sharpe-ratio` first drew a smoothed fund by compounding its reported simple
  returns, and the reported line ended 17% above the true one after fifteen
  years. Smoothing halves the volatility, so it halves the volatility drag too,
  and the picture said smoothing adds return when the article's claim is that
  it adds none. Compounding the returns as changes in the log of the value (what
  an appraiser who moves part of the way does) makes the reported line track the
  true one with a lag and no drift. When a chart shows two versions of one
  series, check the gap at the end is the one the prose describes.
- **A simulated share is only as precise as its sample.** The pairwise-trap
  share in `comparative-advantage` came out at 11.83% under the probe's
  generator and 11.74% under the article's seeded one, 100,000 worlds each. The
  standard error is about 0.1 points, so the prose says "about 12%" and the
  check asserts the rounding, not a decimal the seed chose.

## Every article ships two check files

### `verify/check-numbers.mjs` — `npm run check`

Runs `node --input-type=module` directly against `src/*.js`, no build step, so
every claim the prose makes is re-derived from the same modules the page
imports.

Write the check for the **sentence**, not only for the number in it. A figure
staying correct while the sentence around it stops being true is the failure
this file exists for. Concretely, the assertions read like the claim they
defend:

```js
ok("step 2: two well-separated clusters are still fine at the default k", …)
ok("the article calls it a dead heat, so it had better be within a tenth of a point", …)
ok("it opens with the handle inside its own cluster and nothing flagged", …)
```

What belongs in it:

- **Identities held to machine precision**, not tolerances, wherever the subject
  has a theorem in it. `articles/smote/` asserts that no synthetic point is ever
  outside the convex hull (1.26M trials, 0 escapes) and that a variance ratio
  equals a closed form to 1e-12.
- **Two derivations of the same quantity, checked against each other.** One
  enumerating and one simulating, sharing no code. In `smote` the closed-form
  child moments agree with the sampler to four decimals across seven values of
  `k` and three datasets — neither could be wrong alone.
- **Tolerances are statements about units.** `residual < 1e-10` failed at 6.1e-10
  on a covariance whose largest eigenvalue is 14.25 — a relative error of 4e-11,
  which is fine. Divide by the natural scale first.
- **A trend the prose describes**: load the modules and print the series. The
  `xgboost` article told a story about three RMSE curves in which every claim
  was inverted from what the chart drew.
- **Training error cannot support a generalization claim.** Any argument about
  overfitting, shrinkage, regularization or early stopping needs held-out data
  on the chart. These articles generate from a known truth, so a test set — or
  an exact integral against the generating densities — is a few lines.
- **Numbers from real data are derived from a pinned file, never typed in.** For
  an empirical subject the file lives in the article's `data/`, with series ID,
  provider, URL, retrieval date and sha256 recorded in `data/SOURCES.md`, and the
  check re-derives every figure in the prose from it. Revised series silently
  change published articles, so the vintage is part of the claim.
- **A source that changes in place is pinned through a versioned copy.**
  Shiller's spreadsheet is revised under the same URL, so `equity-premium` pins
  the datasets/s-and-p-500 mirror at one commit, with the commit hash in the URL
  `data/sources.json` downloads from. `scripts/fetch-data.mjs` fails if any hash
  has moved, and the check compares `src/data.js` with a fresh run of
  `scripts/build-data.mjs`.
- **A claim the page doesn't draw is still a claim.** `capm-and-beta`'s costs
  section said equal-weighted groups give a flatter line still, and nothing
  checked it until the final read-through. It is now re-derived from the
  equal-weighted block of the same pinned file, which no figure uses. Costs
  sections and conclusions are where these hide.
- **Precomputed freshness, as the first check.** See below.

### `verify/check-browser.mjs` — Playwright, two viewports

Copy the newest one and change the selectors. The first block of
`articles/cost-curves/verify/check-browser.mjs` (page renders, no sideways
scroll, SVGs fit and have a `viewBox`, finite geometry, no raw `$…$` or `\cmd`,
KaTeX rendered, "Thanks for reading!", no page errors) is article-independent
and can be copied whole; the second block is where this article's interactions
go.

**The scaffold's own `check-browser.mjs` is not a check for your article.** It
asserts the scaffold's `.sticky`, `.steps` and `.plot` elements. Three articles
(`cost-curves`, `perfect-competition`, `monopolistic-competition`) shipped with it
unchanged, so their browser checks crashed on the first selector and had never
run, and two of the three were blank pages that nobody had loaded. Replace it in
pass 2, and in pass 3 treat a check file that throws as a failure, not as
"no failures".

Always present, at 390px and 1280px:

- `pageerror` and console error/warning collection, before *and* after
  interaction.
- `document.documentElement.scrollWidth > window.innerWidth` — and when it
  fails, **name the offender** by walking `body *` for rects crossing the
  viewport. "The page is 93px too wide" is a fact; "this element is" is a fix.
- Every `<svg>`'s edges against its parent's. `body { overflow-x: hidden }`
  means a clipped chart passes the page-level test.
- Nothing *drawn* outside the `<svg>` that contains it. An outer SVG clips
  visually while still widening the document. Skip `.katex svg`: KaTeX draws
  radicals and big delimiters as stretched svgs that overhang their own box on
  purpose.
- No negative `width`, `height` or `r` and no `undefined`/`NaN` in a path `d`,
  swept across ~20 scroll positions.
- `document.body.innerText.match(/\\[a-zA-Z]{2,}/g)` for LaTeX that reached the
  DOM unrendered, plus a non-zero `.katex` count.
- Every `.katex annotation` free of a `;` not preceded by a backslash: a spacing
  command written `\;` inside a JS template literal loses its backslash and
  renders as a literal semicolon, silently (`house-idioms.md`).
- The title TEXT measured with a `Range` (the `h1` box is the container width).
- Text glued to a separator or a word: `/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/`. Read it from the
  **live** page's `innerText` with `.katex` and `svg` set to `display: none`
  for the read, not from a detached clone: a clone's `innerText` behaves like
  `textContent`, so axis ticks ("0years") and adjacent legend items ("wealth
  4wealth 2") come out glued and the check fails on text a reader never sees.
  The live page lays flex items out on separate lines.
- Small-multiple panels share a bounding-rect `top` at desktop and do not on
  mobile.

Plus **one geometry check specific to this article's claim**, in rendered
pixels. This is the check that pays for the file:

- `autoencoders`: every reconstruction circle lies on the decoder's line.
- `lightgbm`: every candidate dot's `cx` matches some bin edge's `x1` to 0.02px.
- `smote`: every synthetic point is on one of the drawn segments; all are inside
  the hull of the drawn fraud points; and a ringed point is outside the shaded
  region while an unringed one is inside, via `path.isPointInFill`.

The last shape is the strongest and worth writing every time: it runs the
model's verdict, the contour, and both coordinate transforms through a single
assertion, so any one of them being in the wrong coordinate system fails
immediately. `elementsFromPoint` variants need the element scrolled into view
first — it silently checks zero points otherwise, which reads as a pass.

**For "this lies on that line", transform the points yourself.** A diagonal
`<line>`'s `getBoundingClientRect` gives its box, not its direction, and leaves
out the stroke. `comparative-advantage` maps each endpoint and each circle
centre through the element's own `getScreenCTM()` and asserts perpendicular
distances in screen pixels: the trading line lies within 0.5px of the frontier
for the economy that gains nothing and more than 10px off it for the other, and
the mirror case is asserted at the other end of the slider.

**A selector that picks the first of several like-classed elements can assert
the opposite of the figure's point.** `constrained-choice` draws two curves in
one panel: one that must stay above a floor, and one whose whole job is to fall
through it. Both were `class="curve"`, the check took
`paths.find(p => p.classList.contains("curve"))`, and it failed loudly on the
contrast curve while never once looking at the curve the sentence was about. The
check was wrong, not the figure. Name each series in the component
(`curve sg`, `curve ces`), select the named one, and — the part worth copying —
add the mirror assertion too: the contrast curve *does* cross the floor. A check
that only tests the well-behaved half of a comparison figure is testing half of
nothing.

**Scaffolded check files inherit selectors for components you deleted.** A new
article's `check-browser.mjs` arrives asserting the scaffold's own `.sticky`,
`.steps`, `line.model` and `circle.handle`, which is a red run for reasons that
are not bugs. Rewrite the article-specific half before the first run, and give
each figure a stable `id` on its wrapper so the checks and the screenshots can
name one.

**"The circle marks the lowest point" is a check on y, not x.** Near the bottom
of a smooth minimum the curve is flat, so the grid vertex with the largest y can
sit a few vertices away from the true minimum while differing by a thousandth of
a pixel. `time-diversification` first asserted the circle's x against that vertex
and failed at 1280px. Assert that the circle's y equals the path's extreme y, and
that the path's vertex nearest the circle's x is at the circle's y.

## Precompute anything too slow to run on load

When the numbers cost more than a fraction of a second, do not compute them in
the browser and do not hard-code them either:

1. `scripts/precompute.mjs` runs the heavy work **from the same `src/` modules
   the page imports** and writes `src/precomputed.js`, which is committed.
2. It exports `run()` and only writes when invoked directly, so the check can
   import it.
3. The **first** check in `check-numbers.mjs` calls `run()` and deep-diffs the
   result against the committed file.

A stale precompute is then a failing check rather than a quiet lie — stronger
than computing in the browser, because it also catches the case where the data
changed and nobody re-ran anything. Keep the *interactive* part live regardless.

## Shipping a build to the browser checks

`npm run dev` inside the VM is not reachable from the host. Use
`./verify/ship.sh`, which builds, refuses warnings, proves the build actually
ran, runs `check-numbers`, tars `public/` and proves the tarball holds the
bundle that is on disk. Then stage that one file, extract it, serve it, and run
Playwright against it.

That script exists because of a specific failure worth knowing about: the build
ran, the tar ran after it, and the tar still packed the *previous* bundle. Two
rounds of "my fix didn't work" were stale code. **The `bundle` hash it prints is
the identity of the code** — if it does not change after an edit, the edit did
not land.

**Three ways to waste a run on the `-m` marker rather than on a bug.** The
marker has to be a string that ends up *in the bundle*, so a sentence you just
added to `verify/` or `README.md` will always report "not found". It has to sit
on one line of the source: a phrase spanning a line break in a `.svelte`
template does not survive compilation as the same substring. And it has to
survive minification: comments are dropped and identifiers renamed, so a marker
taken from a comment, or from code such as `SIZE_MIN ? "start"`, fails on a
build that did land. Pick a distinctive fragment of a string literal or of
template text on a single source line inside `src/`, or watch the `bundle` hash
instead.

**A geometry check against drawn marks needs every mark drawn.** The
`peer-group-outliers` lab clipped its data to a fixed window, so one mule sat
outside the chart; the readout said 19 of the ring were alerts and the check
counted 18 circles. Worse, a centroid outside the window would have been missing
from a "nearest drawn centroid" test. When the claim is about distances between
marks, compute the window from the data (equal aspect, width capped so the chart
isn't too tall) and assert that the readout's count equals the drawn count.

**`ship.sh` packs `verify/check-browser.mjs` into the tarball.** Edit the
check file, then run `ship.sh` again before the browser run, or the run
extracts and executes the previous checks and reports on them.

**Check the checks' runtime before the device does.** `check-numbers.mjs`
re-runs the full precompute for its freshness check, which took about five
minutes for `peer-group-outliers`. `device_bash` stops at 180 seconds, so run
`ship.sh` in the container or with `nohup` on the device, and keep
`SKIP_FRESHNESS=1` for prose iterations only.

**Kill the static server by its port before and after every run.** `npx sirv`
starts a child process that outlives the `npx` you kill. It caches file sizes
from when it started, so after a rebuild it serves a cut-off bundle, the page
throws "Unexpected end of input" and renders blank, and every check times out
on the first selector. It looks exactly like a broken build. Find the process
by `sirv public -p <port>` and kill it, and don't use `pkill -f` with a pattern
your own command line contains.

**Don't run `git` on the device.** Even `git status` writes `.git/index.lock`,
and the device shell can't delete it, so the next git command the owner runs
fails with "another git process seems to be running". Read the repository with
`git --no-optional-locks`, or leave git to the owner.

## Then look at the screenshots

Every bug that mattered in this project was invisible to every assertion:

- a Voronoi layer drawn in data units, tucked into the corner of four charts
- clipped chip text, and an overlay covering the chart it explained
- a paragraph describing a "bulge" in a decision boundary that was not there

The last one is the pattern to watch for. When a paragraph describes a *shape*
in a chart, either replace the description with a number the chart is drawn
from, or look at the chart. Preferably both.

Crop what you look at. Element screenshots at ~700px answer the question; full
pages at 2560px cost several times more and stay in context afterwards. Three
targeted crops beat seven full pages.

## A probe that cannot fail has not checked anything

When the claim is that **X does not depend on Y**, the probe must compute X by a
route that is *allowed to read Y*. Otherwise it is true by construction and
measures only your own factoring.

`nash-equilibrium` claims a player's equilibrium mix does not depend on their own
payoffs. The first probe solved the row player's mix from the column player's
matrix — the one place their own payoffs are structurally absent — and then
reported that it had not moved when the row player's matrix changed. It could not
have moved. The probe passed, proved nothing, and read exactly like a result.

Rewritten, the solver takes both matrices and returns whatever it returns, and
every answer is checked by exploitability, which also reads both. The claim
survived; the first version of it was worthless.

The general shape: an invariance claim needs an **oracle that could have seen the
variable**. If your solver structurally cannot, the zero you are reporting is
your own algebra, not a measurement.

## Sliders in Playwright

`locator.fill()` on an `<input type="range">` refuses a value that is not on the
input's `step` grid ("Malformed value"), so sweep on the grid. A figure that
opens at a value *off* its own grid can never be dragged back to it:
`comparative-advantage` opens its log-scale slider at exactly 2.7, the example
the prose quotes, and the check reads that opening state before it touches the
slider.

## A dynamic programme's answer needs a route with no value function

`samuelson-merton-1969` claims the best share is the same at every horizon,
and the claim comes out of a backward solution on a wealth grid. Checking the
grid against itself proves little, since an interpolation error would move
every horizon together. The check that pays is a brute force over **whole
strategies** for a short horizon (the first year's share and one share per
outcome after it, on a fine grid), which never forms a value function: it
picked 0.835 three times, as the DP did, and the same brute force confirmed
the hedging demand in the reverting market and the "stocks = share × (savings
+ future pay)" rule in `human-capital`. Where the problem has a closed form
(the floor case), assert the DP against it across wealth and horizon.

## A solver needs a closed-form case, and a check away from the grid's edge

`cocco-gomes-maenhout-2005` interpolated its value function linearly on a wealth
grid. The policy was smooth, the shares were plausible, and a check of the grid
against itself would have passed. But linear interpolation gets the *slope* of the
value function wrong to the order of the grid step, and the slope is what the
first-order condition uses, so every policy was slightly off. The check that
found it was the solver run on a case with a closed form (a pure-wealth
problem with no pay, whose share and consumption come from a first-order
condition and a recursion) and compared across the grid.
The fix was a cubic Hermite curve in log wealth, on the value function stored as
F^(1/(1−γ)) so that it is nearly linear. Two rules follow.

- **Every solver gets a case with a closed form, asserted across the grid.** The
  solver is only trusted where a formula agrees with it.
- **Test away from the grid's edges.** Start the comparison well inside the grid.
  A life with no pay runs its cash down towards the grid's floor, where the
  boundary code takes over, so a comparison there tests the boundary and not the
  interpolation. Sample points between nodes, in the range the article draws.

## A continuous-time formula gets a discrete route, and log utility is the γ = 1 case

`cost-of-leverage` states a share for a saver whose borrowing rate differs from
her lending rate. A formula written for continuous trading can be checked by
brute force in a **short-step market**: shrink the step until the return is a
narrow lognormal, maximise expected utility by a numerical search over the share
(quadrature for the expectation, no derivative), and compare with the formula
within about 1%, since the gap shrinks with the step. That route never uses the
first-order condition the formula came from. The kink itself (the strip held at
exactly 100%) is checked in a coin-flip market, where the whole strip is found
by search.

At a risk aversion of 1 the utility x^(1−γ)/(1−γ) is undefined, and a brute
force that code-reuses it returns nonsense. Use ln x there, as the limit
requires. The same trap sits in any brute force that reads a general-γ utility
for a saver whose γ the article lets the reader set to 1.

## A Monte Carlo estimate of a heavy-tailed moment can be pure noise

`lifecycle-leverage`'s pass-1 probe read the coefficient of variation of final
wealth off a simulation of 100,000 savers (1.10 to 1.14, with no trend across
the rules) and built a claim on it. That number is mostly noise. Final wealth is a product of forty lognormals, and its
mean and variance are dominated by a few extremely lucky savers who a
simulation rarely draws. The exact figures come from a **moment recursion**: for
independent years, E[W] and E[W²] are products of exact lognormal moments, so the
coefficient of variation is computed, not sampled (1.11 at all stocks, about
1.07 for every cap from 2 to 1 up: a small fall the simulation could not see). The article reports
quantities a simulation *can* pin down (the spread of ln W, the 5th percentile,
the median) and says so about the one it can't.

- **Ask of every simulated statistic whether the tail decides it.** Means and
  spreads of quantities that multiply are dominated by rare draws. Percentiles
  and the log are not.
- **Check the precomputed simulation with a second simulator**, written
  separately and with its own seed, and assert agreement within the sampling
  tolerance. A bug in a function both routes share would hide from both.
- **An approximation that ranks correctly still gets its size stated.** The
  first-order identity for the variance of ln W overstated the simulation by 6%
  and 9%, and put the rules in the same order. The article says both.

## An invariance through a solver inherits the solver's noise

A claim of the form "the answer does not depend on L" is often checked by
running the same optimiser at several L and comparing the answers. Even when
the argmin is provably identical, the optimiser's *floating point* is not: a
golden-section search whose comparisons sit near a flat minimum can land on
neighbouring doubles for different multipliers, so the four answers agree only
to the search's own noise floor (`efficiency-wages`: 1.6e-7, not 0). Assert
within that stated noise, or make the search exact on purpose — never write
"to the last bit" about a solver's output unless two routes share the
iteration.

## Population moments versus sample estimates

When an article proves an algebraic identity between population moments (e.g.
the true parameter vector, expected values, asymptotic limits, or closed-form
integrals), assert machine precision (`< 1e-12`, typically `~1e-15`). When an
interactive simulation or Monte Carlo routine estimates those moments from a
finite sample of draws (e.g. 200 observed price-quantity shocks or 4,000
shuffle replications), the sample statistic carries random sampling noise
scaling as $O(1/\sqrt{N})$.

- **Never assert exact double equality (`===`) on a finite sample statistic.**
- **State the sample size in the prose when the reader is looking at the
  sample**: a lab that draws 400 simulated economies says so, because the
  reader sees them. The size of the *checks* never goes on the page ("over
  280,000 random markets", "to fourteen decimal places"): that is rule 14 of
  `reference/writing-the-prose.md`, and the prose gate fails on it.
- **Set the test tolerance to the statistical bound** (e.g. `< 5e-3` for
  4,000 draws, `< 0.05` for 200 draws) and label it clearly in the check output
  as a sampling tolerance rather than an arithmetic gap.
- **Test both separately**: assert the closed-form population identity to
  machine precision in one check, and assert the Monte Carlo sample convergence
  in a distinct check.

## Load every page before it goes live

`scripts/build-site.sh` ends by running `scripts/smoke-site.mjs`, which serves
`site/`, opens every article in `site/articles.json` at 390px and 1280px, and
fails on any page error or on a page with under 400 characters of text. Run it on
its own with `node scripts/smoke-site.mjs <slug>`. It exists because `ship.sh`
builds and checks numbers but never opens the page, and two articles went live
blank.

## The final read-through

- **Read it for voice, last, on the rendered page.** Use the checklist at the
  end of `reference/writing-the-prose.md` ("Before calling the prose done").
  Pull the text a reader sees (every paragraph, caption and figure note, in
  page order) and read it straight through. The prose gate in `ship.sh` catches
  the fingerprints of the three ways this project's voice drifts, but it can't
  hear a sentence. Three articles
  passed every check on 17 September with no contractions, a "that framing is
  fundamentally misleading" opener, and literal `$R^2$` showing on the page.

- **Does the demo exercise the idea it is selling?** The `xgboost` article had a
  headline section on the second-order Taylor expansion running entirely on
  squared error, where `h ≡ 1` and the Hessian cancels out of every number on
  screen. Ask whether the mechanism is visible in the demo, or whether the demo
  has been set in the one regime where it disappears.
- **Be fair to the thing you are arguing against.** Read the baseline's
  implementation asking "would someone who liked it have written it this way?"
  An exact split finder making two passes where every real implementation makes
  one inflated a headline ratio by 2×, from a choice in the implementation
  rather than anything about the algorithm.
- **Let the measurements change the article.** The `lightgbm` piece was rebuilt
  around a counter that contradicted its plan; `smote`'s ending went from "the
  threshold wins" to "it is a dead heat, in the same direction three times",
  and both are better for it. Restate the claim at the strength the evidence
  supports, and rewrite the check to match — a check asserting "beats" when the
  data says "ties" is now the wrong check.
- **Claims that do not survive the data.** "Taking their logarithm changes no
  split" — in a dataset reaching −9.2 °C. "Captures 2-way interactions" — with
  one feature. Check the distinct count per column before writing a word about
  bin counts.
- **Framing drift.** One row was a "day" in `datasets.js` and a "household" in
  the walkthrough.
- **A source is a source of claims, not of sentences.** If a paragraph could be
  recognised as a paraphrase of the paper or chapter it came from, rewrite it from
  the measurement instead. Cite the theorem or equation number, and say plainly
  what is yours and what is theirs.
- **Verify citations before writing the sentence that leans on them.** Two
  specifics were cut from `smote` at the last minute because they could not be
  re-checked. Describe a paper from an abstract you have actually read.
- **The limits section is where domain knowledge shows.** Extrapolation and
  unstructured data are the answers everyone gives. What a model validator asks
  first is whether the scores are calibrated, where the stopping rule comes
  from, and what the feature importances are biased toward.

## Readouts rounded one at a time, and curated seeds

- **Rounded readouts don't have to add up.** `market-making`'s three scores read
  −$10.06, +$11.44 and −$1.39, which the reader can add to −$0.01. The prose
  quotes what the readouts show, `check-numbers.mjs` asserts the zero sum on the
  unrounded values, and the browser check allows a cent.
- **When a lab shows "a day" or "a market", curate the seeds and assert each
  one's story.** `market-making` lists its days in `DAYS` (an ordinary one first,
  then one where the price goes the wrong way), and the checks assert the numbers
  and the shape the prose tells about each, so a change to the generator that
  reshuffles the draws fails instead of quietly changing the story.
- **Round in the check the way the page rounds.** `equity-premium`'s lowest
  twenty-year average is 2.55 in decimal. `Math.round(x * 10) / 10` gives 2.6, and
  the readout's `toFixed(1)` gives 2.5, because the float is 2.5499…. The prose
  said 2.6, the readout said 2.5, and both checks passed. Write
  `r1 = (x) => +x.toFixed(1)` in `check-numbers.mjs`, as the page does.
- **A seeded run the reader watches has to be representative, and the check
  says so.** `fundamental-law` shows ten simulated years per manager and quotes
  the long-run tracking errors beside them. The seeds were chosen so that each
  run's realised figure sits within 10% of the long run at the settings the prose
  uses, and the check asserts exactly that, so a new seed or generator can't
  quietly show the reader a run that contradicts the sentence under it.
- **A slowly converging average needs a big sample before it's quoted.**
  `index-construction`'s mean gap over 60 markets was 0.064 and over 1,000 was
  0.043 ± 0.008; the page says "centred near zero" and quotes the one ratio that
  is stable (97% of the gain taken back), asserted over 1,000 markets.

## Reading a chart back through its axes

The finance articles read their charts back in `check-browser.mjs`: tick labels
give the scale (`scales`, `lin`), path data gives the curve (`pts`, `yAt`), and
a dot is checked to lie on its curve in pixels. Two rules from rows 9 to 12
(3 October 2026).

- **A log axis needs a log read-back.** `lin` interpolates between the first and
  last tick labels, which is right only on a linear axis. On `sharpe-ratio`'s
  log-scaled growth chart it would return the right value at the two end ticks
  and the wrong one everywhere else, and a check of "both lines start at $1"
  would pass or fail by accident. Interpolate log10 of the tick values instead.
- **Abbreviated tick labels need their own parser.** `scales()` reads "1k" as
  1, so `fundamental-law`'s log axis (10, 100, 1k, 10k) is read in its check by a
  local function that multiplies a trailing k by 1,000 and interpolates log10.
- **When the claim is an area, read the shape back through both axes.**
  `npv-vs-irr` says each rectangle's area is its NPV. The check converts the
  rect's x, width, y and height to data units through the drawn axes and
  compares their product with the NPV readout, at two rates, for both pairs,
  and for a rectangle hanging below zero. A check of the readout alone would
  have passed with the rectangle drawn from the wrong corner.

## Heavy-tailed medians, calendar years, and areas in pixels

Three rules from rows 19 to 23 of the finance slate (4 October 2026).

- **The median of a heavy-tailed statistic needs many samples, and a range in
  the check.** `fat-tails` quotes the typical sample kurtosis of a Student t
  with 3 degrees of freedom. Forty-one seeds gave 11, 29 and 69 at 1,000, 10,000
  and 100,000 days; a different 41 gave 16, 40 and 84. With 1,001, 401 and 201
  seeds it settles at about 15, 32 to 36, and 70, and the prose says "about 15,
  roughly doubling with each tenfold" (the theory's 10^(1/3)). The check asserts
  ranges, not decimals.
- **"Once every N years" uses calendar years.** The NYSE traded on Saturdays
  until 1952, so 26,317 days are 104 years at 252 a year but 100.2 calendar
  years. `fat-tails` converts with the data's own 262.7 days a year, for the
  normal's waits as well as the data's.
- **When the claim is that a rectangle has an area, compare areas in pixels.**
  `value-at-risk` draws expected shortfall as a dashed rectangle over (α, 1] with
  the same area as the shaded region under the quantile steps. The browser check
  computes the shaded polygon's area by the shoelace formula and compares it with
  the rectangle's width × height at 1, 2 and 100 bonds.
- **A seeded game the reader watches can be chosen to land on the exact
  median.** `kelly-criterion`'s 61 players (seed 116) have a middle player with
  exactly 180 heads in 300 flips, so the readout shows the exact $10,504, and the
  check asserts the counts behind, halved and capped are within one or two of 61
  times their exact chances.

## Blocks of 250 days, drawdowns on a grid, and balance points

Rules from rows 24 to 28 of the finance slate (10 October 2026).

- **Count a regulator's year as 250 trading days, not a calendar year.** Before
  1952 the NYSE traded on Saturdays, so 1932 has 302 trading days and 1968 (the
  paperwork crisis) 226; calendar years made a 1% model's yearly counts
  binomial with different n. `var-backtesting` splits the last 26,000 days into
  104 blocks of 250 ending on the file's last day, so the newest block is "the
  last 250 days" and a right model's zone chances are exact.
- **A simulated worst drawdown on a grid of steps misses about 1.165·σ√dt.**
  Both the peak and the trough are sampled, so the bias is twice the usual
  0.5826·σ√dt for a maximum. `drawdowns` checks its eigenfunction series against
  walks with drift corrected by that amount; uncorrected, its 4,000-step walks
  fall short of the series by about eight standard errors. The
  no-drift case, where the mean is √(π/2)·σ√T exactly, checks the series on its
  own.
- **An identity divided by a variance is 0/0 for a zero.** A zero-coupon bond
  has no spread of payment dates, so "the bend of ln W is Var(t)" and "the
  money at the horizon is lowest at the yield" are degenerate (the money doesn't
  depend on the rate at all). Draw the random bonds for such checks from coupon
  bonds only, and check the zero's case on its own.
- **When the claim is a balance point, check the moments in pixels.**
  `duration-and-convexity` asserts Σ (bar centre − fulcrum)·height ≈ 0,
  normalised by total height × chart width. Normalising by Σ |moment| instead
  would make a single bar (a zero) read ±1, since a sub-pixel offset is all
  the moment there is.
- **A solver near 1 needs the small quantity, not the large one.** The
  drawdown series has a mode with tanh(κh) = κ, and for h past about 19 the
  root is within 1e-16 of 1, where a double can't tell it from 1. Solving for
  δ = 1 − κ (with 1 − tanh written as 2e^(−2y)/(1 + e^(−2y))) and writing the
  integrals with decaying exponentials kept every term finite, where the
  textbook cosh/sinh form subtracted huge numbers from each other.

## Reproduced figures, kinks and bounds

Rules from rows 29 to 33 of the finance slate (10 October 2026).

- **Reproduce one published figure from the pinned data before building on
  it.** `credit-spread-puzzle` pins FRED's Moody's Baa and Aaa series, and its
  1970–2001 average gap, 1.09 points, is the 109 basis points Chen,
  Collin-Dufresne and Goldstein report in their Table 1. That one match is what
  makes the quoted default rates from the same paper comparable with our data.
  FRED downloads work from the build container (`fredgraph.csv?id=...`).
- **Derive quoted numbers from the source's own arithmetic where it gives
  one.** The Friday WTI settlements in `forwards-and-futures` aren't typed in:
  the check derives them from Monday's prices and the day's reported changes
  (−37.63 + 55.90 = 18.27). Palm's synthetic prices are rebuilt from Lamont and
  Thaler's quotes and LIBOR, and match their table to the cent.
- **Quadrature over a kinked payoff is only first-order accurate at the
  kink.** `merton-model`'s recovery, E[V | V < F]/F, by a 20,001-point grid
  agrees with the closed form to 4e-4, not 1e-9; the tolerance says so.
- **A simulated barrier on a grid needs the same shift as a simulated
  drawdown.** Black and Cox's first passage was checked against 20,000 paths of
  2,000 steps with the barrier moved by 0.5826·σ√dt, which is the
  maximum-on-a-grid correction from `drawdowns` applied once.
- **Check a no-arbitrage bound as an optimisation, not by its formula.** The
  three-branch band in `binomial-pricing` is asserted as the cheapest
  portfolio of shares and bank that always pays at least the call, and the
  dearest that never pays more, each searched over a grid of share holdings.
- **A bisection needs a bracket where the function is monotone.** The model's
  Baa-over-Aaa gap rises with λ and then falls once both bonds are nearly sure
  to default in the market's eyes; searching λ up to 3 returned 3. The search
  stops at 0.6 and the check asserts the gap still rises there.
