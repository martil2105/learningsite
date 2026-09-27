# SMOTE

An MLU-Explain-style visual essay on SMOTE, built from the project starter.

**The angle.** SMOTE's whole algorithm is one convex combination: a new minority
row somewhere on the segment between an existing one and one of its `k` nearest
minority neighbours. That line is a *claim* — that the space between two
minority rows is minority territory — and the article is about what the claim
buys, where it is false, and how much that costs.

**The hook.** One draggable fraud row on a scatter of card transactions
(amount × time of day, both standardised, equal aspect). Its `k` nearest fraud
neighbours, the segments to them, and the synthetic rows SMOTE would place on
those segments are all live. Drag it into the middle of ordinary spending and
watch the synthetic fraud follow it there.

## What the standard telling says, and what survived

Written down before anything was built, then measured. Three of the five did
not survive as stated, and the article is largely about those three.

| The received explanation | What the measurement said |
|---|---|
| SMOTE gives the classifier a richer, more varied picture of the rare class than duplicating rows does | **Not in the sense that matters.** Every synthetic row is a convex combination of two real ones, so the convex hull of the augmented set *is* the hull of the original — 1,260,000 children generated across every scenario and every `k`, zero outside. It fills in; it can never reach out. There is no mechanism for a fraud larger than the largest you logged. |
| The synthetic points cluster toward the mean, so the minority class ends up too tight | **A large-`k` statement, quoted as a general one.** Exactly true at `k = n-1`, where the variance ratio is `2/3 − 1/(3(n−1))` = 0.651. At the default `k = 5` the same closed form gives **1.03** — very slightly *wider* than the real cloud. At the setting almost everyone uses, it is not happening. |
| `k = 5` is a sensible default | **It was luck, not safety.** Two clusters of 13 and 9 points: 0.0% of synthetic rows land in the wrong place at `k = 5`, 22.7% at `k = 15` — safe only because 5 was smaller than the clusters. On a realistic label set with four kinds of fraud in unequal numbers it is already 9.6% at `k = 5`, and turning `k` down to 1 does not fix it (5.2%). |
| Balancing the classes helps the classifier | **True, and large.** 0% of the fraud caught → 87%. This is why the method is popular and the article says so plainly. |
| …and that is what the resampling bought you | **No — a threshold buys the same thing.** Moving the decision threshold on the untouched data lands within a tenth of a point in all three scenarios, and slightly ahead in all three: 12.9% vs 13.0%, 2.4% vs 2.5%, 3.4% vs 3.5%. One of the two contestants had to invent 878 rows. |

Every row above is asserted in `verify/check-numbers.mjs`, so a claim that stops
being true fails a check rather than sitting in a README.

## What it argues, and the numbers behind each claim

| Claim | Where it comes from |
|---|---|
| Every synthetic row is inside the convex hull of the real ones | identity; 1,260,000 trials, 0 escapes |
| At `k = n-1` the synthetic cloud's variance is exactly `2/3 − 1/(3(n−1))` of the real one | closed form in `childMoments`, held to 1e-12 |
| The contraction people warn about is **not** happening at the default `k = 5` (ratio 1.03) | same closed form |
| One convex blob: ~0.4% of synthetic rows land in normal territory, at every `k` | sweep |
| Two clusters: exactly 0.0% at `k = 5`, 22.7% at `k = 15` | sweep — the default was luck, not safety |
| A realistic label set: 9.6% at the default `k`, which is 92 misleading rows against 22 real ones | sweep + the balancing run |
| SMOTE takes a classifier that catches 0% of the fraud to one that catches 87% | integrated balanced error |
| Moving the threshold gets to the same place, slightly ahead in all three scenarios, without inventing a row | same |
| The two resulting boundaries disagree on 7.0% of the plane (weighted) | grid comparison |

## Layout

```
Meta → Logo → Title → Intro
     → SmoteLab              the hook
     → TextAndMathEquations  the formula and the two identities
     → ScrollSide            five steps across three label sets
     → KSweep                contamination vs k (small multiples) + spread vs k
     → Verdict               boundaries, and the balanced-error comparison
     → Conclusion → Resources
```

`ScatterPanel.svelte` is the shared picture used by `ScrollSide` and `Verdict`.

## Source layout

- `src/datasets.js` — the generative model. One domain throughout (card
  transactions), three label sets. The drawing window is part of the data:
  samples are drawn by rejection inside it, so time of day stays inside one
  turn of a circular variable and nothing can be drawn outside the chart.
- `src/smote.js` — SMOTE, Borderline-SMOTE, ENN, the convex hull, the two
  territory verdicts, a kNN classifier, and `childMoments` (exact moments of
  the child distribution, no sampling).
- `src/contour.js` — marching squares with border clamping, so every region
  closes inside the window instead of being closed by a chord across the chart.
- `src/plot.js` — equal-aspect fitting. Every claim here is about distance.
- `src/experiments.js` — what the page reads.
- `src/precomputed.js` — **generated**; run `npm run precompute` after touching
  `datasets.js` or `smote.js`. A stale copy is a failing check, not a quiet lie.

## Commands

```
npm install
npm run dev          # http://localhost:5000, livereload
npm run build
npm run precompute   # regenerates src/precomputed.js
npm run check        # 62 numeric and claim assertions
```

The browser pass needs Playwright and a served build:

```
npm run build
python3 -m http.server 8767 -d public &
node verify/check-browser.mjs          # SHOTS=<dir> also writes screenshots
```

It asserts, in rendered pixels, that every synthetic point lies on one of the
drawn segments, that all of them are inside the hull of the drawn fraud points,
and that a ringed point is outside the shaded region while an unringed one is
inside — plus the usual overflow, NaN, negative-geometry and console checks at
390px and 1280px.

`verify/_browser-check-bundle.tgz` is a disposable build tarball used to carry
`public/` to a machine with a browser. Deletion is not permitted on this mount,
so it is left in place rather than cleaned up.

## Not published yet

There is no `smote` entry in `site/articles.json`, so `./scripts/build-site.sh`
skips it. Add one to publish.

## Licensing

Derived from MLU-Explain's Svelte starter under CC BY-SA 4.0, credited in the
conclusion and references. No Amazon Ember: the article ships self-hosted Inter
and IBM Plex Mono. No MLU-Explain branding in the masthead. All prose, data and
figures are original.
