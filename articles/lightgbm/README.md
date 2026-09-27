# LightGBM: histogram binning

An interactive visual essay on the one idea most of LightGBM's speed rests on —
bucketing a column and searching the buckets instead of the rows.

Deliberately narrow. This is not a gradient boosting explainer; it assumes the
reader knows what a split gain is (see `articles/xgboost/` for that) and spends
its whole length on histogram-based split finding.

**The hook:** the first split of the first tree, on one column, with
`max_bin` on a slider. The thin line is the gain at all 5,961 cuts the exact
scan would score; the dots are the ones a histogram lets you see. At 255 bins it
scores 254 of them and keeps 99.90% of the best gain available. At 8 bins it
scores 7 and keeps 98.06%, at a threshold a kilometre away from the right one.

**The argument, in order:**

1. The gain depends on the data only through four sums, so pre-added sums are
   as good as rows. That is the entire opening.
2. Prefix-scanning a histogram gives `#bins - 1` candidates however many rows
   there are, and the identity `parent = left + right` means you build only the
   smaller child.
3. What that actually buys, measured with counters rather than a stopwatch:
   **6.0× fewer** gain evaluations, **3.2× fewer** gradient reads, for **0.4%**
   of held-out error. And the surprise — with the subtraction switched off the
   histogram touches 10.35M rows against the exact scan's 10.75M, so the
   bucketing on its own saves no passes over the data at all. The row saving is
   entirely the subtraction identity.
4. Coarse bins are not free: 32 bins costs 25% of held-out error here and saves
   almost no row work, because building a histogram is a pass over the rows
   whatever its width. How many bins you need falls as `min_data_in_leaf` rises
   — 255 at a floor of 20, 64 at a floor of 250 — because bins are a grid for
   placing leaf boundaries.
5. Where it bites: a split can only be a bin edge; the edges are quantiles from
   a sample; a column with few distinct values is never binned at all.

## Running it

```
npm install
npm run dev        # http://localhost:5000, with livereload
npm run build      # production build into public/
npm run check      # re-derive every number, and re-run every committed fit
```

## The one structural difference from the other articles

Every other article here computes its figures in the browser on load, so the
prose cannot drift from the code. This one cannot: the sweeps are twelve boosted
forests, about five seconds, which would leave the page blank while it ran.

So `scripts/precompute.mjs` runs them from the same modules the page imports and
writes `src/precomputed.js`, which is committed. The guarantee is restored by
`verify/check-numbers.mjs`, whose **first** check re-runs every one of those fits
and diffs the result against the committed file. A stale precompute is a failing
check, not a quiet lie. If you change `datasets.js`, `gbdt.js` or `binning.js`:

```
node scripts/precompute.mjs && npm run check
```

The hook is still live — one node, one column, a couple of milliseconds per bin
setting — because the reader is dragging a slider through it.

## Verifying

`verify/check-numbers.mjs` (`npm run check`) covers the precompute freshness, the
guarantee that a binned split can never beat the exact one, the subtraction
identity bin by bin, and the article's least obvious claim: that the histogram
alone touches as many rows as the pre-sorted scan.

`verify/check-browser.mjs` drives a served build in Chromium at 1280 and 390.
The check specific to this article is the cross-panel one: every candidate dot in
the upper panel must sit exactly on a bin edge in the lower panel, since both are
drawn from the same x scale. It also sweeps the whole page for negative width,
height or radius attributes, which is what a measured width of zero looks like.

`verify/_browser-check-bundle.tgz` is a disposable tarball of `public/`, for
moving a build to a machine that has Playwright. Safe to delete.

## Notes specific to this article

- **The counters are operation counts, not timings.** `COUNTERS` in
  `binning.js` records gradient reads and gain evaluations exactly. The
  constant-factor wins binning also brings — sequential access, a one-byte
  payload — are real and invisible to a count, so the ratios quoted are if
  anything conservative.
- **The exact split finder is given the node totals** rather than recomputing
  them. A second pass would double its row count and make the comparison
  flattering to the histogram for no good reason.
- **Three continuous features and one integer one**, on purpose: `stops` has 16
  distinct values and is therefore never binned at any setting, which is a fact
  about every real dataset and is one of the article's points.

Design system and article format from [MLU-Explain](https://mlu-explain.github.io/),
used under CC BY-SA 4.0. Writing, code and data are original.
