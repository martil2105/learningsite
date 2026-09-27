# constrained-choice

**Kind** model · **Shape** assumption lab, entered through a build-up ·
**Hook** `WageLab` · **Analog by shape** `dbscan-hdbscan`

## Angle

The received account says a wage rise sets an income effect against a
substitution effect and that theory cannot say which wins. For the utility
function every course draws, theory says exactly which wins: neither. The two
cancel identically at every wage, and the long-run fall in working hours has to
come from somewhere else.

## The model

Free time `f ∈ (0,T]`, consumption `c = w(T−f)`, CES preferences
`U = [α c^ρ + (1−α) f^ρ]^{1/ρ}` with `ρ = 1 − 1/σ`. Throughout: `α = 0.5`,
`T = 16`, so the Cobb–Douglas answer is an exactly eight-hour day.

## Claims and verdicts

Every verdict below is asserted in `verify/check-numbers.mjs`.

1. **"A wage rise makes free time dearer, so the substitution effect raises
   hours."** — True, and large. Hicks, w 25 → 400: compensated free time moves
   −6.000000000000 of 8 hours, three quarters of the worker's leisure.

2. **"A wage rise makes you richer and free time is normal, so the income effect
   cuts hours."** — True, and exactly as large: +6.000000000000.

3. **"Which dominates is an empirical question theory cannot settle."** — False
   as taught. At σ = 1, `h = αT` for every wage: max |h(w) − αT| over
   w ∈ [10⁻², 10⁶] is **exactly 0**, and hours move by exactly zero across the
   lab's whole slider. The empirical question only exists off σ = 1, and there
   σ *determines* the sign: `dlog h/dlog w = (σ−1)·f/T`, verified against a
   central difference.

4. **"The optimum is the tangency, MRS = w."** — True. At σ = 1 the closed form
   and a bisection on the first-order condition agree bit for bit; across
   σ ∈ [0.4, 2.5] they agree to under 1e−14. Golden-section maximisation of U
   agrees only to ~2e−8 and no better — the flat-maximum √ε limit, asserted in
   both directions, and the reason the condition is solved rather than the
   maximum searched.

5. **"The model explains the long-run fall in hours: the income effect won."** —
   Misleading. A constant σ < 1 does give falling hours but drives them to zero
   (h(10⁶) < 0.02 at σ = 0.5); it cannot produce fall-then-level. Cobb–Douglas
   with a subsistence floor gives `h(w) = αT + (1−α)c̄/w`: monotone falling,
   always above αT, and converging on exactly the Cobb–Douglas answer.

## The identity on screen

`log(h/f) = σ·log(α/(1−α)) + (σ−1)·log w`

Exactly linear in `log w` with slope **σ − 1**. Over the slider's σ range and
the figure's wage range the worst residual from the fitted line is under 1e−11
and the measured slope matches σ−1 to the same order. The closed-form line and
the numerically solved points differ by under 1e−12. Nothing is fitted; the
least-squares fit exists only so the slope on screen is measured rather than
asserted.

## Figures

| Component | Carries |
|---|---|
| `Frontier` | build-up 1 — the wage is the slope, and nothing else |
| `Indifference` | build-up 2 — preferences are a rate, and the rate falls |
| `Tangency` | build-up 3 — the optimum is where the two rates agree |
| `WageLab` | the hook — drag the frontier, set σ, watch the locus |
| `Decomposition` | claims 1 and 2 — two large arrows landing on each other |
| `SigmaLine` | the identity — a fan of straight lines, σ = 1 horizontal |
| `Subsistence` | claim 5 — what actually bends the curve |

## Source

CORE Econ, *The Economy 2.0: Microeconomics* (2023), Unit 3 and its
mathematical Extension — the subject, and nothing else. No prose, figure,
worked example or exercise datum is taken from it. The CES generalisation, the
log-odds identity, the parameters and the Stone–Geary close are the article's
own.

## Verification

`./verify/ship.sh` — build with no warnings, **29 checks pass**.
`verify/check-browser.mjs` at 390px and 1280px — **46 checks pass**.

The geometry assertion this article pays for is its own claim in rendered
pixels: at σ = 1 the locus of optima spans under 0.35px horizontally, the
optimum dot sits on both the drawn frontier and that locus, and twelve arrow-key
presses raise the wage (the handle moves up the screen) without moving it
sideways. The σ = 2 preset is then clicked to prove the check is not vacuous —
the same locus spans more than 5px. A second assertion puts the identity on
screen the same way: every solved point in `SigmaLine` lies within 0.35px of the
line the closed form draws.

Found by the browser pass and fixed:

- one KaTeX display equation made the document 67px wider than a 390px
  viewport. Display maths cannot be reached by scoped CSS, so
  `.katex-display { overflow-x: auto }` went into `global.css` — promoted to
  `reference/house-idioms.md`.
- the subsistence check selected the first `.curve`, which is the σ = 0.5
  contrast curve whose whole job is to fall through the floor. The check was
  wrong, not the figure; both curves are now named and the mirror assertion
  (the contrast curve *does* cross) was added — promoted to
  `reference/verifying-an-article.md`.

Found by looking at the screenshots and fixed:

- `Decomposition`'s net-change sentence was an `<svg><text>`: it does not wrap,
  so it ran the full width of the panel and sat on top of the axis and its tick
  labels. Moved to HTML below the plot.
- the lab's readout said hours were unmoved "over the whole wage range on this
  slider" — the slider is σ; the wage is dragged.

## Citations checked

Robbins, *Economica* 29 (1930), 123–129 — read; he is answering Pigou and
Knight and concludes the elasticity must be ascertained empirically, which is
exactly the hedge this article argues with. ACMS, *Review of Economics and
Statistics* 43 (1961), 225–250, and Geary, *Review of Economic Studies* 18
(1950), 65–66 — bibliographic details confirmed; cited only for the CES form and
the subsistence term respectively, with no claim made about their contents.
