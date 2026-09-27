# `compound-growth`

**Kind** result · **Shape** build-up → question → lab · **Hook** `FanLab` ·
**Stack** Svelte 5 + Vite

Pass-1 spec: `claude/compound-growth-pass1-spec.md` in the project.
Row 17 (Ma4) of `economics-curriculum-slate.md`.

## The angle

A one-point gap in growth rates doubles the gap in living standards in about
seventy years, which is the slate's claim and is true. But the average of an
economy's growth rates is not the rate it grew at: it overstates it by about half
the variance. With uncertain growth, the expected path and the typical one drift
apart for ever, and the share of paths above the expected level is exactly
Φ(−σ√t/2).

## Claims and verdicts

| # | Received claim | Verdict |
|---|---|---|
| 1 | Rule of 70 | **Exact at 1.98%** (rule of 72 at 7.85%); 35.0 years at 2% |
| 2 | A one-point gap doubles the level gap in ~70 years | **71.0 years** (3% vs 2%); 7.2× vs 19.2× after a century |
| 3 | The average growth rate is how fast it grew | **False**: +8%/−2% averages 3% but compounds at 2.88%; A is 6.1% richer after 50 years (4.38× vs 4.13×); a ± s compounds at √((1+a)² − s²) − 1; ±24.7 points around 3% give zero growth |
| 4 | With uncertain growth, expected income grows at the average rate, and so does a typical economy | **Only the first**: expected level 2.69× at every σ; median 2.66× (σ 2%), 1.53× (15%), 0.99× (20%); share above expected 47.2%, 29.8%, 24.0%, falling with time; ln(1+A) − ln(1+G) = σ²/2 exactly |

## Layout

| Section | Component |
|---|---|
| the build-up | `LogScaleFigure` — 2% and 3% for a century, ordinary vs log axis, year scrubber |
| the question | `SwingQuiz` — steady 3% vs +8%/−2%; the paths after a pick |
| the identity | `DragFigure` — compound rate vs swing, exact and approximate, the zero crossing |
| the hook | `FanLab` — 400 seeded lognormal paths, σ slider and presets, expected vs median |

## Verification

- `npm run check` — **29 checks**, including a separate simulation of 20,000
  paths with its own generator (xorshift and Marsaglia polar normals) against
  the exact Φ(−σ√t/2), and the lab's own 400 paths within sampling error.
- `verify/check-browser.mjs` — **51 checks** at 390px and 1280px: the 2% path
  is straight within 0.6px on the log axis and bends by more than 10px on the
  ordinary one; the doubling markers, the quiz's end dots, the drag marker and
  zero ring, and the fan's summary markers all sit on their curves; the fan's
  readouts are the exact values at every preset.

## Sources

Peters (2019), Nature Physics 15:1216–1221. Standard lognormal algebra
otherwise. Nothing reproduced.
