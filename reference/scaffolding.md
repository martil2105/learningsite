# Scaffolding a new article

Read in pass 2, before creating the directory.

## Scaffold by selective copy — never `cp -r` the starter

`device_bash` cannot delete files on this mount and the permission request has
been refused before, so a recipe that ends in `rm` is a recipe that gets stuck.
Copy only what you want and there is nothing to delete.

**Copy the plumbing from `articles/_scaffold-svelte5/`.** That is the Svelte 5 +
Vite stack, proved green through `ship.sh` and the browser checks at both
viewports. The dependency-free `src/*.js` modules port across stacks unchanged,
so the good ones still come from the articles that have them.

```bash
SRC=articles/_scaffold-svelte5           # the stack: build config and plumbing
STATS=articles/population-stability-index
GEO=articles/dbscan-hdbscan
DST=articles/<slug>

mkdir -p $DST/src/Components $DST/public/assets $DST/scripts $DST/verify
cp $SRC/{package.json,vite.config.js,svelte.config.js,.gitignore} $DST/
cp $SRC/src/{main.js,katexify.js,rng.js,chart.js,palette.js} $DST/src/
cp $SRC/src/Components/{Scrolly.svelte,Logo.svelte} $DST/src/Components/
cp $SRC/public/index.html $DST/public/
cp -r $SRC/public/assets/{fonts,katex-fonts,styles} $DST/public/assets/
cp $SRC/verify/{check-browser.mjs,ship.sh} $DST/verify/

# plain dependency-free JS — it ports across stacks untouched:
cp $STATS/src/stats.js $DST/src/     # normal, chi-square, gamma, beta, binomial,
                                     # multinomial, dirichlet, quantiles, trapz.
                                     # Any subject with a null law wants this.
cp $GEO/src/plot.js $DST/src/        # fitEqual + clipRayThroughOrigin — whenever
                                     # the argument is about distance
cp $GEO/src/contour.js $DST/src/     # regions rather than only points
```

Then rename `package.json`'s `name` and `description`, set
`public/index.html`'s `<title>`, `npm install`, and write `Meta.svelte`,
`Title.svelte`, `App.svelte`, `datasets.js`, the subject module and every
component fresh.

**The page furniture is fixed; the words aren't.** `Title.svelte` (the `#intro`
block), `Conclusion.svelte`, `Resources.svelte`, `Meta.svelte` and the style
block at the end of `App.svelte` follow the page-furniture rules in
`reference/writing-the-prose.md`. `articles/cost-curves` is the model: take the
structure and the CSS from it, and write every sentence fresh. Don't take the
section order, which is shape (below). Read `writing-the-prose.md` in full
before the first sentence. `ship.sh` runs its gate on every build, and
`build-site.sh` won't publish an article that fails it.

`verify/check-browser.mjs` *is* copied, and half of it is about the scaffold's
own components. Keep the common first block described in
`reference/verifying-an-article.md` (`articles/cost-curves/verify/check-browser.mjs`
is the model) and replace the rest with this article's own checks before
running it for the first time. Otherwise it fails on `.sticky`, `.steps` and
`circle.handle`, none of which the new article has, and a check file that
crashes has checked nothing.

**A finance article also takes the finance kit**, which isn't in the scaffold:
`src/{finance.css,format.js,scale.js,random.js}` and
`src/Components/{Figure,Slider,Segmented,Readout,AxisX,AxisY}.svelte` from
`articles/dividends-and-buybacks/` (or any later finance article: rows 24 to 28
took it, with `stats.js` and `clip.js`, from `value-at-risk`), plus its `public/` assets and its
`verify/check-browser.mjs` common block and read-back helpers (`scales`, `lin`,
`pts`, `yAt`, `setRange`). `GuessCard`, `Title`, `Meta`, `Conclusion` and
`Resources` are written fresh, since every word in them is the article's.
Rows 9 to 12 were built this way in the container in one session, and each
check file was its common block plus a block of this article's own checks.

**Read the scaffold's `Lab.svelte` and `check-numbers.mjs`; do not copy them.**
`Lab.svelte` is a worked example of the house rules in runes — a zero-height
measuring child, one clamped width, a `viewBox`, pointer input converted back to
user units, the two deliberate a11y ignores, a sentence built in the script
block — and `check-numbers.mjs` shows the `ok()` harness and what an identity
asserted to machine precision looks like. Both are about a subject that does not
exist, which is why they are read rather than inherited.

`chart.js` is the generic drawing plumbing: `linear`, `log`, `ticks`, `logTicks`,
`shortN`, `pathOf`, `areaOf`, `bandOf`, `clampW`. It replaced the older
`plot.js`-for-everything arrangement; `plot.js` is now only the equal-aspect
geometry, which most articles do not need.

**The title, subtitle and meta description can't name another article's
subject.** `ship.sh` looks for every other slug, as words, in `Title.svelte`,
`Meta.svelte` and `index.html`, and a finance article's subject is often a
neighbour's slug: `kelly-criterion`'s description said "Sharpe ratio" and
`volatility-clustering`'s subtitle said "fat tails", and both failed. Say it
another way in the furniture ("the market's wildest days"); the body and the
sources can name the neighbour freely.

**A data article reuses the daily kit.** `efficient-markets`, `fat-tails` and
`volatility-clustering` each carry the same `data/` (French's daily file,
pinned), `scripts/{data-lib,fetch-data,build-data}.mjs` and
`src/{data,market}.js`; copy all of them from one of the three and add the
article's own module.

Amazon Ember, `mlu_robot.png`, the Svelte template favicon, `Scatter.js`,
`StaticChart.svelte` and `CenterScroll.svelte` never arrive by this route, so the
licensing non-negotiables hold by construction.

**Copy the infrastructure; copy nothing about the shape.** The list above is
deliberately all plumbing — build config, the seeded RNG, the drawing helpers, the
scroll observer, the site mark, the stylesheets. `App.svelte`, the section order
and the choice of figures are decisions the subject makes for itself, and taking
them from the last article is how seven of ten articles ended up with the same
skeleton. `reference/choosing-the-shape.md` has the argument and the table.

`npm install` pulls 54 packages and prints `npm warn cleanup ... EPERM` — that
is this mount refusing deletes, and it is harmless. `npm run build` takes about
0.3s. Read `reference/house-idioms.md` before the first component, and mind its
Environment section: `emptyOutDir` must stay `false`, GNU sed, always `<<'EOF'`,
and `sync; sleep 1` between a build and anything that reads its output.

## The reference repo has two stacks — do not mix them

`reference/aws-mlu-explain/code/` is read for component patterns only.

**Svelte 3 + Rollup 2 — ours.** `linear-regression`, `logistic-regression`,
`roc-auc`, `precision-recall`, `cross-validation`, `neural-networks`,
`reinforcement-learning`, `equality-of-odds`, `starter-mlu-explain`.

**Parcel + vanilla D3 + sass — a different architecture, not an analog.**
`bias-variance`, `decision-tree`, `random-forest`, `train-test-validation`,
`double-descent`, `double-descent2`, `parcel-mlu-explain-starter`.

Their README omits `cross-validation`, `neural-networks`, `reinforcement-learning`
and `equality-of-odds`; those four are real.

The repo is 243MB and stays local — it is never copied into `site/`, and neither
is anything in `sources/`.
