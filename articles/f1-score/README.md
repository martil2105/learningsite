# F1 Score

An MLU-Explain-style visual essay on what happens when you tune a decision
threshold by maximising F1 — which is what almost everyone does.

**The angle.** MLU-Explain's own `precision-recall` article already teaches what
precision, recall and F1 *are*. This one is about what F1 *does to you*: the
threshold it selects has a closed form that depends on the model rather than on
the problem, the estimate of it from a normal validation set is far noisier than
anyone assumes, and the tradeoff it encodes drifts with prevalence while the
model sits still.

**The shape: question first.** The reader is handed a validation set and asked
to do the received thing — slide the threshold until F1 peaks — before anything
is explained. The article then tells them what they just did. This is the first
article in the project not built lab-first.

**The hook.** A threshold slider on a live PR curve with F1 shown and a
best-found marker. Smaller interactions: a re-draw-the-validation-set control on
the spread figure, a prevalence slider on the drift figure, and cost-ratio
presets on the closing figure.

## What the standard telling says, and what survived

Written down before anything was built, then measured.

| The received explanation | What the measurement said |
|---|---|
| F1 balances precision and recall — a neutral summary | **Not neutral.** It balances them at one specific implied cost ratio, which nobody chose, and which is a property of the model rather than of the problem. |
| Maximise F1 on a validation set to choose a threshold | **The rule has a closed form.** In expectation the optimum is exactly "act when the score exceeds F1max/2" — checked at four prevalences, the optimum bracketing F1max/2 to five decimals every time. At the base case that is 0.2552 = 0.5105/2, an implied cost ratio of 2.92×. |
| …and a 6,000-row validation set is enough to find it | **No.** Across 40 draws the empirical argmax ranged **0.124 to 0.386** (sd 0.056). In cost terms, sample luck alone moved the asserted tradeoff between **1.6× and 7.0×**. |
| F1 lets you compare models and track them over time | **Not across prevalence.** Model frozen, prevalence 1.95% → 12.3%: F1max 0.399 → 0.590 and the implied cost ratio 4.01× → 2.39×. |
| A better model gives you a better version of the same policy | **It gives you a different policy.** Because t\* = F1max/2, improving F1max from 0.51 to 0.70 moves the threshold 0.255 → 0.350 and the implied ratio 2.92× → 1.86×. Nothing about the cost of a shutdown changed. |
| The F1 you report is the F1 you have | **Optimistic by ~0.007**, because the threshold was selected on the same rows the score was read from. |
| There is a peak to find | **There is a plateau.** Found in the review pass by looking at the chart rather than the numbers: every threshold from **0.148 to 0.265** scores within 0.005 of the best. Half a point of F1 separates policies asserting **2.78×** and **5.74×**. This is the spread result visible on a single validation set, without resampling anything. |

Every row is asserted in `verify/check-numbers.mjs`.

## Layout

```
Meta → Logo → Title → Intro
     → HuntLab           the hook: find the threshold that maximises F1
     → TheReveal         t* = F1max/2, the two-line proof, checked across prevalences
     → WhatThatMeans     the cost ratio you asserted without choosing it
     → SpreadFigure      re-draw the validation set and watch the policy move
     → DriftFigure       freeze the model, slide prevalence, watch the objective re-weight
     → CostFigure        what to do instead: state the ratio and minimise expected cost
     → Conclusion → Resources
```

## Source layout

- `src/datasets.js` — the generative model. **Scores are calibrated by
  construction**: each unit gets a true risk and the label is a coin weighted by
  it. That is what makes "this threshold asserts a cost ratio of (1−t)/t" an
  identity rather than an approximation. Prevalence moves by changing the *mix*
  of two fixed populations, never the populations, so the drift figure really
  does hold the model still.
- `src/metrics.js` — PR curve over a scored set (ties handled together), F-beta,
  average precision, the implied cost ratio and its inverse, expected cost.
- `src/precomputed.js` — **generated**; `npm run precompute` after touching
  either of the above. A stale copy is a failing check.

## Commands

```
npm install
npm run dev          # http://localhost:5000
npm run precompute   # regenerates src/precomputed.js
npm run check        # the numeric and claim assertions
./verify/ship.sh     # build, prove it, run the numbers, produce a browser-check tarball
```

## Not published yet

No `f1-score` entry in `site/articles.json`, so `./scripts/build-site.sh` skips
it. Add one to publish.

## Licensing

Derived from MLU-Explain's Svelte starter under CC BY-SA 4.0, credited in the
conclusion and references. Self-hosted Inter and IBM Plex Mono; no Amazon Ember,
no MLU-Explain branding in the masthead. All prose, data and figures original.
